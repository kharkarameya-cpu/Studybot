const cron = require('node-cron');
const StudyChannelManager = require('../services/studyChannelManager');
const StudySession = require('../models/StudySession');
const logger = require('../utils/logger');

function initJobs(client) {
  // Check for empty voice channels every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Running empty channel cleanup job...');
    await StudyChannelManager.cleanupEmptyChannels(client);
  });

  // Check for expired sessions every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running expired session cleanup job...');
    const now = new Date();
    const expiredSessions = await StudySession.find({
      isActive: true,
      expiresAt: { $lt: now }
    });

    for (const session of expiredSessions) {
      const guild = client.guilds.cache.get(session.guildId);
      if (guild) {
        await StudyChannelManager.closeSession(session, guild);
        logger.info(`Session expired and closed: ${session.topic}`);
      }
    }
  });
}

module.exports = initJobs;
