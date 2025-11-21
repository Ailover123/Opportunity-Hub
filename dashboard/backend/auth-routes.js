// auth-routes.js (env-compatible, safe to require even if env missing)
const express = require('express');
const GoogleDriveIntegration = require('./google-drive-integration');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// instantiate safely (do NOT throw at require time)
let driveIntegration = null;
try {
  driveIntegration = new GoogleDriveIntegration();
} catch (err) {
  console.warn('GoogleDriveIntegration not initialized:', err.message);
  driveIntegration = null;
}

// Store user sessions temporarily (in production, use Redis or a DB)
const userSessions = new Map();

/**
 * GET /auth/google
 * Initiate OAuth flow -> return authUrl (frontend can redirect)
 */
router.get('/auth/google', (req, res) => {
  try {
    if (!driveIntegration) throw new Error('Drive integration not configured. Check env vars.');
    const authUrl = driveIntegration.getAuthUrl();
    // Return authUrl as JSON so frontend can handle redirect
    res.json({ authUrl });
  } catch (error) {
    console.error('GET /auth/google error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /auth/google/callback
 * Handle OAuth callback from Google (must match the redirect URI in GCP)
 */
router.get('/auth/google/callback', async (req, res) => {
  try {
    if (!driveIntegration) throw new Error('Drive integration not configured. Check env vars.');

    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Authorization code not provided' });

    // Exchange code for tokens
    const tokens = await driveIntegration.getTokens(code);

    // Set tokens on the driveIntegration instance for subsequent calls
    driveIntegration.setTokens(tokens);

    // Retrieve basic user info
    const userInfo = await driveIntegration.getUserInfo();

    // Create session
    const sessionId = uuidv4();
    userSessions.set(sessionId, {
      tokens,
      userInfo,
      createdAt: new Date()
    });

    // Respond with sessionId and user info (frontend will store sessionId)
    // Redirect popup to frontend helper page which will save sessionId to localStorage and close popup
    const frontendRedirect = `http://localhost:5173/oauth-success.html?sessionId=${encodeURIComponent(sessionId)}`;
    return res.redirect(frontendRedirect);

  } catch (error) {
    console.error('GET /auth/google/callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /auth/status/:sessionId
 * Check authentication status for a session
 */
router.get('/auth/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = userSessions.get(sessionId);
  if (!session) return res.json({ authenticated: false });
  res.json({
    authenticated: true,
    user: session.userInfo,
    connectedAt: session.createdAt
  });
});

/**
 * POST /drive/upload/:sessionId
 * Upload a file (body: { filePath, filename })
 * Note: using local file paths is fine for testing but in production accept file uploads (multer)
 */
router.post('/drive/upload/:sessionId', express.json(), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { filePath, filename } = req.body;

    const session = userSessions.get(sessionId);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });

    // Create a new GoogleDriveIntegration instance for per-request safety, or set tokens on shared one
    // We'll set tokens on the existing instance (as done at callback)
    driveIntegration.setTokens(session.tokens);

    const result = await driveIntegration.uploadCsvFile(filePath, filename || 'upload.csv');
    res.json({ success: true, file: result });
  } catch (error) {
    console.error('POST /drive/upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /drive/files/:sessionId
 * List files from the OpportunityHub folder
 */
router.get('/drive/files/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = userSessions.get(sessionId);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });

    driveIntegration.setTokens(session.tokens);
    const files = await driveIntegration.listFiles();
    res.json({ files });
  } catch (error) {
    console.error('GET /drive/files error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /auth/disconnect/:sessionId
 * Remove session
 */
router.post('/auth/disconnect/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (userSessions.has(sessionId)) {
    userSessions.delete(sessionId);
    return res.json({ success: true, message: 'Disconnected from Google Drive' });
  } else {
    return res.status(404).json({ error: 'Session not found' });
  }
});

module.exports = router;
