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
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
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

    // Fetch user from DB to get latest plan_id
    db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) return res.status(403).json({ error: 'User not found' });
      req.user = user;
      next();
    });
  });
};

// --- AUTH ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const id = uuidv4();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (id, email, name, password, plan_id) VALUES (?, ?, ?, ?, ?)',
      [id, email, name, hashedPassword, 'free'],
      (err) => {
        if (err) return res.status(500).json({ error: 'User already exists' });
        res.json({ success: true });
      });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, user: { id: user.id, name: user.name, plan: user.plan_id, email: user.email } });
  });
});


app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, plan: req.user.plan_id, email: req.user.email } });
});

app.get('/api/auth/session', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.json({ user: null });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.json({ user: null });

    db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) return res.json({ user: null });
      res.json({ user: { id: user.id, name: user.name, plan: user.plan_id, email: user.email } });
    });
  });
});


// --- PAYMENT ROUTES ---
app.post('/api/payments/create-checkout', authenticateToken, async (req, res) => {
  const { planId, gateway } = req.body; // gateway: 'stripe' or 'razorpay'
  try {
    if (gateway === 'stripe') {
      const url = await paymentService.createStripeSession(req.user.id, planId);
      res.json({ url });
    } else {
      const order = await paymentService.createRazorpayOrder(req.user.id, planId);
      res.json({ order });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/verify-razorpay', authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
  const verified = paymentService.verifyUPIPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (verified) {
    db.run('UPDATE users SET plan_id = ? WHERE id = ?', [planId, req.user.id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update plan' });
      res.json({ success: true });
    });
  } else {
    res.status(400).json({ error: 'Payment verification failed' });
  }
});

// --- SCRAPING ROUTES ---
app.post('/api/collect', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const plan = req.user.plan_id;

  try {
    const worker = app.get('worker');
    worker.addTask(userId, plan);
    res.json({ success: true, message: 'Collection task queued in background' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GOOGLE AUTH & DRIVE (LEGACY SUPPORT) ---
app.use('/api', authRoutes);

// --- COMMUNITY & MEETING ROUTES ---
app.use('/api/community', authenticateToken, communityRoutes);
app.use('/api/meetings', authenticateToken, meetingRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// --- NEW MODULAR ROUTES ---
app.use('/api/opportunities', authenticateToken, opportunityRoutes);
app.use('/api/sources', authenticateToken, sourceRoutes);
app.use('/api/export', authenticateToken, exportRoutes);
app.use('/api/schedules', authenticateToken, scheduleRoutes);
app.use('/api/profile', authenticateToken, require('./src/api/routes/profile'));
app.use('/api/chat', authenticateToken, require('./src/api/routes/chat'));

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => res.json({ status: 'SaaS Active', timestamp: new Date() }));

// --- SOCKET.IO REAL-TIME ---
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  socket.on('join_team', (teamId) => {
    socket.join(teamId);
    console.log(`[Socket] User ${socket.id} joined team: ${teamId}`);
  });

  socket.on('send_message', (data) => {
    // data: { teamId, userId, userName, content }
    io.to(data.teamId).emit('new_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

// Attach io and worker to app
app.set('io', io);
const worker = new BaseWorker(io);
app.set('worker', worker);

// Start Server
server.listen(PORT, () => {
  console.log(`\x1b[32m✔ OpportunityHub SaaS Backend running on port ${PORT}\x1b[0m`);
});