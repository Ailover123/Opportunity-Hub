const express = require('express');
const GoogleDriveIntegration = require('./google-drive-integration');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const driveIntegration = new GoogleDriveIntegration();

// Store user sessions temporarily (in production, use Redis or database)
const userSessions = new Map();

// Initiate OAuth flow
router.get('/auth/google', (req, res) => {
  try {
    const authUrl = driveIntegration.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle OAuth callback
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Exchange code for tokens
    const tokens = await driveIntegration.getTokens(code);
    
    // Get user info
    driveIntegration.setTokens(tokens);
    const userInfo = await driveIntegration.getUserInfo();
    
    // Create user session
    const sessionId = uuidv4();
    userSessions.set(sessionId, {
      tokens,
      userInfo,
      createdAt: new Date()
    });

    // In a real app, you'd redirect to your frontend with the session token
    res.json({
      success: true,
      sessionId,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      message: 'Google Drive connected successfully!'
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check authentication status
router.get('/auth/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = userSessions.get(sessionId);
  
  if (!session) {
    return res.json({ authenticated: false });
  }
  
  res.json({
    authenticated: true,
    user: session.userInfo,
    connectedAt: session.createdAt
  });
});

// Upload file to Google Drive
router.post('/drive/upload/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { filePath, filename } = req.body;
    
    const session = userSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Set tokens for this request
    driveIntegration.setTokens(session.tokens);
    
    // Upload file
    const result = await driveIntegration.uploadCsvFile(filePath, filename);
    
    res.json({
      success: true,
      file: result
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List user's OpportunityHub files
router.get('/drive/files/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = userSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    driveIntegration.setTokens(session.tokens);
    const files = await driveIntegration.listFiles();
    
    res.json({ files });
    
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect Google Drive
router.post('/auth/disconnect/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (userSessions.has(sessionId)) {
    userSessions.delete(sessionId);
    res.json({ success: true, message: 'Disconnected from Google Drive' });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

module.exports = router;