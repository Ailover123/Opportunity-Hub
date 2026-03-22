require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const { db, initDB } = require('./src/utils/db');
const paymentService = require('./src/services/paymentService');
const scraperService = require('./src/services/scraperService');
const BaseWorker = require('./src/workers/baseWorker');
const ScoringEngine = require('./src/services/scoringEngine');
const { checkTier } = require('./src/middleware/tierGuard');

const authRoutes = require('./auth-routes'); // Legacy Google Auth
const communityRoutes = require('./src/api/routes/community');
const meetingRoutes = require('./src/api/routes/meetings');
const notificationRoutes = require('./src/api/routes/notifications');
const opportunityRoutes = require('./src/api/routes/opportunities');
const sourceRoutes = require('./src/api/routes/sources');
const exportRoutes = require('./src/api/routes/export');
const scheduleRoutes = require('./src/api/routes/schedules');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-hub-2026';

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Request Logger
app.use((req, res, next) => {
  if (!req.url.includes('/api/auth/me')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// DB Connection & Initialization
initDB().catch(err => console.error('DB Init Failed:', err));

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });

    db.get('SELECT * FROM users WHERE id = ?', [decoded.id]).then(user => {
      if (!user) return res.status(403).json({ error: 'User not found' });
      req.user = user;
      next();
    }).catch(err => res.status(500).json({ error: 'Database error' }));
  });
};

// --- AUTH ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const id = uuidv4();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO users (id, email, name, password, plan_id) VALUES (?, ?, ?, ?, ?)',
      [id, email, name, hashedPassword, 'free']);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed or user exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email]).then(async (user) => {
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax' // Better for same-domain session persistence
    });
    res.json({ success: true, user: { id: user.id, name: user.name, plan: user.plan_id, email: user.email } });
  }).catch(err => res.status(500).json({ error: 'Login failed' }));
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, plan: req.user.plan_id, email: req.user.email, skills: req.user.skills, bio: req.user.bio } });
});

// Added to handle frontend session checks and avoid HTML fallback
app.get('/api/auth/session', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ authenticated: false });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ authenticated: false });
    
    // Fetch full user for session restoration
    db.get('SELECT id, name, email, plan_id FROM users WHERE id = ?', [decoded.id]).then(user => {
      if (!user) return res.status(401).json({ authenticated: false });
      res.json({ authenticated: true, user: { id: user.id, name: user.name, plan: user.plan_id, email: user.email } });
    }).catch(() => res.status(500).json({ error: 'Session check failed' }));
  });
});

// --- OPPORTUNITY RANKING ---
app.get('/api/opportunities/ranked', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const skills = req.user.skills ? req.user.skills.split(',').map(s => s.trim()) : [];
  const interests = req.user.bio ? req.user.bio.split(',').map(i => i.trim()) : [];
  
  const engine = new ScoringEngine({ skills, interests });

  db.all('SELECT * FROM opportunities WHERE user_id = ? OR user_id IS NULL', [userId]).then(rows => {
    const result = engine.rank(rows);
    res.json(result);
  }).catch(err => res.status(500).json({ error: 'Failed to fetch opportunities' }));
});

// --- UPDATING STATUS ---
app.patch('/api/opportunities/:id/status', authenticateToken, async (req, res) => {
  const { status, score, reasons, rank, intent_tag } = req.body;
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    await db.run('UPDATE opportunities SET status = ? WHERE id = ?', [status, id]);

    if (status === 'applied') {
      const actionId = uuidv4();
      const profileSnapshot = JSON.stringify({ skills: req.user.skills, bio: req.user.bio });
      const reasonSnapshot = JSON.stringify(reasons || []);
      
      await db.run(
        'INSERT INTO user_actions (id, user_id, opportunity_id, action_type, score_at_time, reason_snapshot, profile_snapshot, rank_at_time, intent_tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [actionId, userId, id, 'applied', score || 0, reasonSnapshot, profileSnapshot, rank || 0, intent_tag || null]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// --- SCRAPING ---
app.post('/api/collect', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const plan = req.user.plan_id;

  try {
    const worker = app.get('worker');
    worker.addTask(userId, plan);
    await db.run('UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
    res.json({ success: true, message: 'Collection task queued' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES ---
app.use('/api', authRoutes);
app.use('/api/community', authenticateToken, communityRoutes);
app.use('/api/meetings', authenticateToken, meetingRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/opportunities', authenticateToken, opportunityRoutes);
app.use('/api/sources', authenticateToken, sourceRoutes);
app.use('/api/export', authenticateToken, exportRoutes);
app.use('/api/schedules', authenticateToken, scheduleRoutes);
app.use('/api/profile', authenticateToken, require('./src/api/routes/profile'));
app.use('/api/chat', authenticateToken, require('./src/api/routes/chat'));

app.get('/api/health', (req, res) => res.json({ status: 'SaaS Active', timestamp: new Date() }));

// --- SOCKET.IO ---
io.on('connection', (socket) => {
  socket.on('join_team', (teamId) => socket.join(teamId));
  socket.on('send_message', (data) => io.to(data.teamId).emit('new_message', data));
});

app.set('io', io);
const worker = new BaseWorker(io);
app.set('worker', worker);

// --- STATIC FRONTEND SERVING (PRODUCTION) ---
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`\x1b[32m✔ OpportunityHub SaaS Backend running on port ${PORT}\x1b[0m`);
});