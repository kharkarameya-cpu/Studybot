const { 
  ChannelType, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const StudySession = require('../models/StudySession');
const logger = require('../utils/logger');

class StudyChannelManager {
  async createStudyGroup(guild, owner, subject, categoryId) {
    try {
      const voiceChannel = await guild.channels.create({
        name: subject,
        type: ChannelType.GuildVoice,
        parent: categoryId,
        permissionOverwrites: [
          {
            id: owner.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
            ],
          },
        ],
      });

      await StudySession.create({
        guild_id: guild.id,
        voice_channel_id: voiceChannel.id,
        owner_id: owner.id,
        topic: subject,
      });

      logger.info(`Study group created: ${subject} by ${owner.username}`);
      return { voiceChannel };
    } catch (error) {
      logger.error(`Error creating study group: ${error.message}`);
      throw error;
    }
  }

  async handleUserLeave(voiceChannel) {
    try {
      if (voiceChannel.members.size === 0) {
        const session = await StudySession.findOne({
          voice_channel_id: voiceChannel.id,
          is_active: 1,
        });

        if (session) {
          await voiceChannel.delete();
          await StudySession.close(session.id);
          logger.info(`Last user left study group: ${session.topic}. Deleting immediately.`);
        }
      }
    } catch (error) {
      logger.error(`Error handling user leave: ${error.message}`);
    }
  }

  async closeSession(session, guild) {
    try {
      const channel = await guild.channels.fetch(session.voice_channel_id).catch(() => null);
      if (channel) await channel.delete();
      await StudySession.close(session.id);
    } catch (error) {
      logger.error(`Error closing session ${session.topic}: ${error.message}`);
    }
  }

  async refreshAllDashboards(client) {
    const activeSessions = await StudySession.find({ is_active: 1 });
    logger.info(`Refreshing UI for ${activeSessions.length} active sessions...`);

    for (const session of activeSessions) {
      try {
        const guild = await client.guilds.fetch(session.guild_id);
        const voiceChannel = await guild.channels.fetch(session.voice_channel_id);
        
        const messages = await voiceChannel.messages.fetch({ limit: 10 });
        const dashboardMsg = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);

        if (dashboardMsg) {
          const s1 = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('s1').setPlaceholder('Change channel settings').addOptions([
            { label: 'Name', value: 'name', emoji: '📝' }, { label: 'Limit', value: 'limit', emoji: '👥' }, { label: 'Status', value: 'status', emoji: '💬' }, { label: 'Subject', value: 'subject', emoji: '🎮' },
            { label: 'LFM', value: 'lfm', emoji: '📢' }, { label: 'Bitrate', value: 'bitrate', emoji: '📶' }, { label: 'Region', value: 'region', emoji: '🌐' }
          ]));
          const s2 = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('s2').setPlaceholder('Change channel permissions').addOptions([
            { label: 'Lock', value: 'lock', emoji: '🔒' }, { label: 'Unlock', value: 'unlock', emoji: '🔓' }, { label: 'Permit', value: 'permit', emoji: '✅' }, { label: 'Reject', value: 'reject', emoji: '🚫' }, { label: 'Invite', value: 'invite', emoji: '➕' }
          ]));
          const b1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('load_settings').setLabel('Load Settings').setStyle(ButtonStyle.Primary).setEmoji('⚙️'),
            new ButtonBuilder().setLabel('Dashboard').setStyle(ButtonStyle.Link).setURL('https://discord.com')
          );

          await dashboardMsg.edit({ components: [s1, s2, b1] });
        }
      } catch (e) {
        logger.error(`Failed to refresh dashboard for session ${session.id}: ${e.message}`);
      }
    }
  }
}

module.exports = new StudyChannelManager();
