const StudySession = require('../models/StudySession');
const StudyChannelManager = require('../services/studyChannelManager');
const logger = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    // We only care if someone leaves a channel
    if (!oldState.channelId) return;

    // Check if the old channel was a study session channel
    const session = await StudySession.findOne({ 
      guildId: oldState.guild.id, 
      voice_channel_id: oldState.channelId, 
      isActive: 1 
    });

    if (!session) return;

    // If the channel is now empty
    const channel = oldState.channel;
    if (channel && channel.members.size === 0) {
      logger.info(`Last user left study group: ${session.topic}. Deleting immediately.`);
      await StudyChannelManager.closeSession(session, oldState.guild);
    }
  },
};
