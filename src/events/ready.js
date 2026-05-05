const logger = require('../utils/logger');
const DriveService = require('../services/drive');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      await DriveService.initialize();
    } else {
      logger.info('Google Drive integration skipped (no credentials provided).');
    }
  },
};
