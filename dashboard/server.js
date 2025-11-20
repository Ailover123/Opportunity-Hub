const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer');

// Import scrapers
const DevpostScraper = require('./scrapers/devpost-scraper');
const KaggleScraper = require('./scrapers/kaggle-scraper');
const CourseraScraper = require('./scrapers/coursera-scraper');
const IndeedScraper = require('./scrapers/indeed-scraper');

// Import Google Drive integration
const GoogleDriveIntegration = require('./google-drive-integration');
const authRoutes = require('./auth-routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mount auth routes
app.use('/api', authRoutes);

// Ensure exports directory exists
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
  console.log('Created exports directory');
}

// Initialize SQLite database
const db = new sqlite3.Database('./opportunityhub.db');

// Initialize database tables
db.serialize(() => {
  // Users table - Updated with Google Drive integration
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    google_drive_token TEXT,
    google_drive_refresh_token TEXT,
    google_session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Data sources table
  db.run(`CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    url TEXT,
    type TEXT,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Collected data table
  db.run(`CREATE TABLE IF NOT EXISTS collected_data (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    category TEXT,
    organization TEXT,
    deadline TEXT,
    url TEXT,
    description TEXT,
    prize TEXT,
    location TEXT,
    status TEXT DEFAULT 'pending',
    quality_score INTEGER DEFAULT 0,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Schedules table
  db.run(`CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    frequency TEXT,
    time TEXT,
    timezone TEXT,
    enabled BOOLEAN DEFAULT 1,
    last_run DATETIME,
    next_run DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Export history table - Updated with Google Drive links
  db.run(`CREATE TABLE IF NOT EXISTS export_history (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    filename TEXT,
    format TEXT,
    items_count INTEGER,
    status TEXT DEFAULT 'pending',
    local_path TEXT,
    drive_file_id TEXT,
    drive_view_link TEXT,
    drive_download_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Real scraping modules
const scrapingModules = {
  hackathon: async (source) => {
    const scraper = new DevpostScraper();
    try {
      const results = await scraper.scrapeHackathons();
      await scraper.close();
      return results;
    } catch (error) {
      console.error('Hackathon scraping failed:', error);
      await scraper.close();
      return [];
    }
  },
  
  job: async (source) => {
    const scraper = new IndeedScraper();
    try {
      const results = await scraper.scrapeJobs();
      await scraper.close();
      return results;
    } catch (error) {
      console.error('Job scraping failed:', error);
      await scraper.close();
      return [];
    }
  },
  
  competition: async (source) => {
    const scraper = new KaggleScraper();
    try {
      const results = await scraper.scrapeCompetitions();
      await scraper.close();
      return results;
    } catch (error) {
      console.error('Competition scraping failed:', error);
      await scraper.close();
      return [];
    }
  },
  
  certification: async (source) => {
    const scraper = new CourseraScraper();
    try {
      const results = await scraper.scrapeCertifications();
      await scraper.close();
      return results;
    } catch (error) {
      console.error('Certification scraping failed:', error);
      await scraper.close();
      return [];
    }
  }
};

// Data validation functions
const validateData = (data, category) => {
  let score = 0;
  let status = 'pending';

  // Basic validation checks
  if (data.title && data.title.length > 5) score += 20;
  if (data.organization && data.organization.length > 2) score += 20;
  if (data.url && data.url.startsWith('http')) score += 20;
  if (data.description && data.description.length > 20) score += 20;
  
  // Category-specific validation
  if (category === 'hackathon' || category === 'competition') {
    if (data.deadline) score += 10;
    if (data.prize) score += 10;
  }
  
  if (category === 'job') {
    if (data.location) score += 20;
  }

  // Determine status based on score
  if (score >= 80) status = 'verified';
  else if (score >= 60) status = 'pending';
  else status = 'rejected';

  return { score, status };
};

// Check for duplicates
const checkDuplicates = async (userId, newData) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) as count FROM collected_data 
      WHERE user_id = ? AND (title = ? OR url = ?)
    `;
    
    db.get(query, [userId, newData.title, newData.url], (err, row) => {
      if (err) reject(err);
      else resolve(row.count > 0);
    });
  });
};

// API Routes

// Get dashboard stats
app.get('/api/dashboard/:userId', (req, res) => {
  const { userId } = req.params;
  
  const queries = [
    `SELECT COUNT(*) as total FROM collected_data WHERE user_id = ?`,
    `SELECT COUNT(*) as verified FROM collected_data WHERE user_id = ? AND status = 'verified'`,
    `SELECT COUNT(*) as pending FROM collected_data WHERE user_id = ? AND status = 'pending'`,
    `SELECT category, COUNT(*) as count FROM collected_data WHERE user_id = ? GROUP BY category`
  ];

  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.all(query, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    })
  )).then(results => {
    const stats = {
      total: results[0][0]?.total || 0,
      verified: results[1][0]?.verified || 0,
      pending: results[2][0]?.pending || 0,
      categories: results[3].reduce((acc, row) => {
        acc[row.category] = row.count;
        return acc;
      }, {})
    };
    res.json(stats);
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

// Get data sources
app.get('/api/sources/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(
    'SELECT * FROM data_sources WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// Add data source
app.post('/api/sources', (req, res) => {
  const { userId, name, url, type } = req.body;
  const id = uuidv4();
  
  db.run(
    'INSERT INTO data_sources (id, user_id, name, url, type) VALUES (?, ?, ?, ?, ?)',
    [id, userId, name, url, type],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id, userId, name, url, type, active: true });
      }
    }
  );
});

// Run data collection - ENHANCED WITH GOOGLE DRIVE
app.post('/api/collect/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log(`Starting data collection for user: ${userId}`);
    
    // Create default sources if none exist
    const existingSources = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM data_sources WHERE user_id = ?', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (existingSources.length === 0) {
      console.log('No sources found, creating default sources...');
      const defaultSources = [
        { name: 'Devpost Hackathons', url: 'https://devpost.com/hackathons', type: 'hackathon' },
        { name: 'Indeed Jobs', url: 'https://indeed.com', type: 'job' },
        { name: 'Kaggle Competitions', url: 'https://kaggle.com/competitions', type: 'competition' },
        { name: 'Coursera Free Courses', url: 'https://coursera.org', type: 'certification' }
      ];

      for (const source of defaultSources) {
        const id = uuidv4();
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO data_sources (id, user_id, name, url, type) VALUES (?, ?, ?, ?, ?)',
            [id, userId, source.name, source.url, source.type],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    // Get active data sources for user
    const sources = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM data_sources WHERE user_id = ? AND active = 1',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    let totalCollected = 0;
    let totalVerified = 0;

    // Process each source type (one per category to avoid duplicates)
    const processedTypes = new Set();
    
    for (const source of sources) {
      if (processedTypes.has(source.type)) continue;
      processedTypes.add(source.type);
      
      try {
        console.log(`Scraping ${source.type} from ${source.name}...`);
        const scrapedData = await scrapingModules[source.type](source);
        
        for (const item of scrapedData) {
          // Check for duplicates
          const isDuplicate = await checkDuplicates(userId, item);
          
          if (!isDuplicate) {
            // Validate data
            const { score, status } = validateData(item, source.type);
            
            // Insert into database
            const id = uuidv4();
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO collected_data 
                (id, user_id, title, category, organization, deadline, url, description, prize, location, status, quality_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, userId, item.title, source.type, item.organization, item.deadline, 
                 item.url, item.description, item.prize, item.location, status, score],
                function(err) {
                  if (err) reject(err);
                  else resolve(this.lastID);
                }
              );
            });
            
            totalCollected++;
            if (status === 'verified') totalVerified++;
          }
        }
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error.message);
      }
    }

    console.log(`Collection completed: ${totalCollected} items collected, ${totalVerified} verified`);

    res.json({
      success: true,
      collected: totalCollected,
      verified: totalVerified,
      sources: sources.length
    });

  } catch (error) {
    console.error('Data collection failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get collected data
app.get('/api/data/:userId', (req, res) => {
  const { userId } = req.params;
  const { category, status, limit = 100 } = req.query;
  
  let query = 'SELECT * FROM collected_data WHERE user_id = ?';
  let params = [userId];
  
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY collected_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Export data to CSV - ENHANCED WITH GOOGLE DRIVE UPLOAD
app.post('/api/export/:userId', async (req, res) => {
  const { userId } = req.params;
  const { categories, format = 'csv', uploadToDrive = false, sessionId } = req.body;
  
  try {
    // Get data to export
    let query = 'SELECT * FROM collected_data WHERE user_id = ?';
    let params = [userId];
    
    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      query += ` AND category IN (${placeholders})`;
      params.push(...categories);
    }
    
    const data = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (data.length === 0) {
      return res.json({
        success: false,
        error: 'No data found to export'
      });
    }

    // Create CSV file
    const filename = `opportunities_${Date.now()}.csv`;
    const filepath = path.join(exportsDir, filename);

    const writer = csvWriter.createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'title', title: 'Title' },
        { id: 'category', title: 'Category' },
        { id: 'organization', title: 'Organization' },
        { id: 'deadline', title: 'Deadline' },
        { id: 'location', title: 'Location' },
        { id: 'prize', title: 'Prize' },
        { id: 'url', title: 'URL' },
        { id: 'status', title: 'Status' },
        { id: 'quality_score', title: 'Quality Score' },
        { id: 'collected_at', title: 'Collected Date' }
      ]
    });

    await writer.writeRecords(data);

    let driveResult = null;
    
    // Upload to Google Drive if requested and user is authenticated
    if (uploadToDrive && sessionId) {
      try {
        const driveResponse = await fetch(`http://localhost:${PORT}/api/drive/upload/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: filepath, filename })
        });
        
        if (driveResponse.ok) {
          const driveData = await driveResponse.json();
          driveResult = driveData.file;
        }
      } catch (driveError) {
        console.error('Google Drive upload failed:', driveError);
      }
    }

    // Record export in history
    const exportId = uuidv4();
    db.run(
      `INSERT INTO export_history 
      (id, user_id, filename, format, items_count, status, local_path, drive_file_id, drive_view_link, drive_download_link) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [exportId, userId, filename, format, data.length, 'completed', filepath,
       driveResult?.fileId || null, driveResult?.viewLink || null, driveResult?.downloadLink || null]
    );

    console.log(`Export completed: ${filename} with ${data.length} items`);

    res.json({
      success: true,
      filename,
      items: data.length,
      downloadUrl: `/api/download/${filename}`,
      driveLink: driveResult?.viewLink || null,
      uploadedToDrive: !!driveResult
    });

  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download exported file
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(exportsDir, filename);
  
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Get export history
app.get('/api/exports/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(
    'SELECT * FROM export_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// Schedule management
app.post('/api/schedule/:userId', (req, res) => {
  const { userId } = req.params;
  const { frequency, time, timezone, enabled } = req.body;
  
  // Calculate next run time
  const nextRun = new Date();
  const [hours, minutes] = time.split(':');
  nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (nextRun <= new Date()) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  db.run(
    `INSERT OR REPLACE INTO schedules 
    (id, user_id, frequency, time, timezone, enabled, next_run) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, userId, frequency, time, timezone, enabled, nextRun.toISOString()],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ 
          success: true, 
          schedule: { frequency, time, timezone, enabled, nextRun: nextRun.toISOString() }
        });
      }
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    scrapers: ['devpost', 'kaggle', 'coursera', 'indeed'],
    database: 'connected',
    googleDrive: 'integrated'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`OpportunityHub Backend Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Exports directory: ${exportsDir}`);
  console.log(`Google Drive integration: ENABLED`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close();
  process.exit(0);
});