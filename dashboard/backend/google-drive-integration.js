// google-drive-integration.js
// Env-only Google Drive integration (Option A)
// Requires environment variables:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REDIRECT_URI  (optional, defaults to http://localhost:3000/auth/callback)

const { google } = require('googleapis');
const fs = require('fs');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';

class GoogleDriveIntegration {
  constructor() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      // fail early and clearly when someone tries to instantiate without config
      throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.');
    }

    this.oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    // do not call setCredentials here — tokens are per-user and supplied later
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  // Generate OAuth URL for user authorization
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens (use getToken)
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      // tokens may include refresh_token on first consent
      // do NOT save tokens here — caller should persist tokens securely
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  // Set user tokens for authenticated requests
  setTokens(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Create OpportunityHub folder in user's Drive (returns folderId)
  async createOpportunityHubFolder() {
    try {
      // Look for folder named OpportunityHub
      const res = await this.drive.files.list({
        q: "name='OpportunityHub' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name)'
      });

      if (res.data && res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id;
      }

      // Create new folder
      const folderMetadata = {
        name: 'OpportunityHub',
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // Upload CSV file to Google Drive (returns metadata)
  async uploadCsvFile(filePath, filename, folderId = null) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found: ' + filePath);
      }

      if (!folderId) {
        folderId = await this.createOpportunityHubFolder();
      }

      const fileMetadata = {
        name: filename,
        parents: folderId ? [folderId] : undefined
      };

      const media = {
        mimeType: 'text/csv',
        body: fs.createReadStream(filePath)
      };

      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink, webContentLink'
      });

      // Make file shareable (optional)
      try {
        await this.drive.permissions.create({
          fileId: file.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      } catch (permErr) {
        // non-fatal: permission change may fail for various account restrictions
        console.warn('Warning: could not set file permission:', permErr.message || permErr);
      }

      return {
        fileId: file.data.id,
        fileName: file.data.name,
        viewLink: file.data.webViewLink,
        downloadLink: file.data.webContentLink
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Get user info (email/name)
  async getUserInfo() {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      return userInfo.data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  // List files in OpportunityHub folder
  async listFiles(folderId = null) {
    try {
      if (!folderId) {
        folderId = await this.createOpportunityHubFolder();
      }

      const files = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, createdTime, size, webViewLink)',
        orderBy: 'createdTime desc'
      });

      return files.data.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
}

module.exports = GoogleDriveIntegration;
