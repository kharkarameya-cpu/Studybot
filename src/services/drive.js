const { google } = require('googleapis');
const logger = require('../utils/logger');

class DriveService {
  constructor() {
    this.drive = null;
  }

  async initialize() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      this.drive = google.drive({ version: 'v3', auth });
      logger.info('Google Drive Service Initialized');
    } catch (error) {
      logger.error(`Failed to initialize Google Drive: ${error.message}`);
    }
  }

  async searchFiles(query) {
    if (!this.drive) return [];
    try {
      // Search files where name matches and it's not a folder
      const response = await this.drive.files.list({
        q: `name contains '${query}' and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name, webViewLink)',
        pageSize: 5,
      });
      return response.data.files;
    } catch (error) {
      logger.error(`Drive Search Error: ${error.message}`);
      return [];
    }
  }
}

module.exports = new DriveService();
