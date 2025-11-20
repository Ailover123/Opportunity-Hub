const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveIntegration {
  constructor() {
    // Load OAuth credentials
    const credentialsPath = '/workspace/uploads/client_secret_241449115178-q9ugsbtm0croltok6e0ujlu5k90p8r7g.apps.googleusercontent.com.json';
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    this.oauth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      credentials.web.redirect_uris[0] // Use first redirect URI
    );
    
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

  // Exchange authorization code for tokens
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      this.oauth2Client.setCredentials(tokens);
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

  // Create OpportunityHub folder in user's Drive
  async createOpportunityHubFolder() {
    try {
      // Check if folder already exists
      const existingFolders = await this.drive.files.list({
        q: "name='OpportunityHub' and mimeType='application/vnd.google-apps.folder'",
        fields: 'files(id, name)'
      });

      if (existingFolders.data.files.length > 0) {
        return existingFolders.data.files[0].id;
      }

      // Create new folder
      const folderMetadata = {
        name: 'OpportunityHub',
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      console.log('Created OpportunityHub folder:', folder.data.id);
      return folder.data.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // Upload CSV file to Google Drive
  async uploadCsvFile(filePath, filename, folderId = null) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found: ' + filePath);
      }

      // Ensure we have a folder ID
      if (!folderId) {
        folderId = await this.createOpportunityHubFolder();
      }

      const fileMetadata = {
        name: filename,
        parents: [folderId]
      };

      const media = {
        mimeType: 'text/csv',
        body: fs.createReadStream(filePath)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink'
      });

      console.log('Uploaded file to Drive:', file.data);
      
      // Make file shareable (optional)
      await this.drive.permissions.create({
        fileId: file.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

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

  // Get user info
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
        q: `'${folderId}' in parents`,
        fields: 'files(id, name, createdTime, size, webViewLink)',
        orderBy: 'createdTime desc'
      });

      return files.data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
}

module.exports = GoogleDriveIntegration;