const { ChannelType, PermissionFlagsBits } = require('discord.js');
const StudySession = require('../models/StudySession');
const logger = require('../utils/logger');
const SettingsService = require('./settingsService');

class StudyChannelManager {
  async createStudyGroup(guild, owner, subject, categoryId) {
    try {
      const existing = await StudySession.findOne({ 
        guildId: guild.id, 
        ownerId: owner.id, 
        topic: subject, 
        isActive: 1 
      });

      if (existing) {
        throw new Error('You already have an active study group for this topic.');
      }

      const voiceChannel = await guild.channels.create({
        name: subject,
        type: ChannelType.GuildVoice,
        parent: categoryId,
        permissionOverwrites: [
          {
            id: owner.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
              PermissionFlagsBits.MoveMembers,
            ],
          },
        ],
      });

      const sessionData = {
        guildId: guild.id,
        ownerId: owner.id,
        topic: subject,
        voiceChannelId: voiceChannel.id,
        textChannelId: 'none', // No text channel created
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      await StudySession.create(sessionData);
      logger.info(`Study group created: ${subject} by ${owner.tag}`);

      return { voiceChannel };
    } catch (error) {
      logger.error(`Error creating study group: ${error.message}`);
      throw error;
    }
  }

  async cleanupEmptyChannels(client) {
    const activeSessions = await StudySession.find({ is_active: 1 });
    
    for (const session of activeSessions) {
      try {
        const guild = await client.guilds.fetch(session.guild_id);
        const voiceChannel = await guild.channels.fetch(session.voice_channel_id);
        
        if (voiceChannel && voiceChannel.members.size === 0) {
          logger.info(`Deleting empty study group: ${session.topic}`);
          await this.closeSession(session, guild);
        }
      } catch (error) {
        if (error.code === 10003) { // Unknown Channel
          await StudySession.updateStatus(session.id, false);
        } else {
          logger.error(`Cleanup Error for ${session.topic}: ${error.message}`);
        }
      }
    }
  }

  async closeSession(session, guild) {
    try {
      const voiceChannel = await guild.channels.fetch(session.voice_channel_id);
      if (voiceChannel) await voiceChannel.delete();

      if (session.text_channel_id && session.text_channel_id !== 'none') {
        const textChannel = await guild.channels.fetch(session.text_channel_id);
        if (textChannel) await textChannel.delete();
      }

      await StudySession.updateStatus(session.id, false);
    } catch (error) {
      logger.error(`Error closing session ${session.topic}: ${error.message}`);
    }
  }
}

module.exports = new StudyChannelManager();
