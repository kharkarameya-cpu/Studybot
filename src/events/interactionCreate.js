const { 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const logger = require('../utils/logger');
const SettingsService = require('../services/settingsService');
const StudyChannelManager = require('../services/studyChannelManager');
const StudySession = require('../models/StudySession');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try { await command.execute(interaction); } catch (e) { await interaction.reply({ content: 'Error!', ephemeral: true }); }
    } 
    
    else if (interaction.isStringSelectMenu() || interaction.isButton()) {
      const { customId, guild, user, channelId } = interaction;
      const action = interaction.values ? interaction.values[0] : customId;

      if (customId === 'select_branch') {
        const branch = interaction.values[0];
        const modal = new ModalBuilder().setCustomId(`subject_modal_${branch}`).setTitle(`${branch} Study Session`);
        const input = new TextInputBuilder().setCustomId('subject_input').setLabel('What subject are you studying?').setPlaceholder('e.g. Calculus, Physics...').setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return await interaction.showModal(modal);
      }

      const session = await StudySession.findOne({ guildId: guild.id, isActive: 1, voice_channel_id: channelId });
      if (!session || session.owner_id !== user.id) return await interaction.reply({ content: '❌ Only the room owner can use these controls.', ephemeral: true });

      try {
        const voiceChannel = await guild.channels.fetch(session.voice_channel_id);
        if (action === 'lock') {
          await voiceChannel.permissionOverwrites.edit(guild.roles.everyone, { Connect: false });
          return await interaction.reply({ content: '🔒 **Room Locked.** New participants cannot join.', ephemeral: true });
        }
        if (action === 'unlock') {
          await voiceChannel.permissionOverwrites.edit(guild.roles.everyone, { Connect: true });
          return await interaction.reply({ content: '🔓 **Room Unlocked.** Everyone is welcome.', ephemeral: true });
        }

        const modal = new ModalBuilder().setCustomId(`update_${action}_modal`).setTitle(`Update ${action.toUpperCase()}`);
        const input = new TextInputBuilder().setCustomId('new_value').setLabel(`Enter new ${action}`).setStyle(TextInputStyle.Short).setRequired(true);
        
        if (action === 'lfm') input.setLabel('Recruitment Message').setPlaceholder('e.g. Need 2 more for group study!');
        if (['permit', 'reject', 'invite'].includes(action)) input.setLabel('User ID or @Mention');
        
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return await interaction.showModal(modal);
      } catch (e) { await interaction.reply({ content: `❌ Error: ${e.message}`, ephemeral: true }); }
    }

    else if (interaction.isModalSubmit()) {
      const { customId, guild, user, channelId } = interaction;
      const newValue = interaction.fields.getTextInputValue(interaction.fields.fields.first().customId);

      if (customId.startsWith('subject_modal_')) {
        const branch = customId.split('_')[2];
        await interaction.deferReply({ ephemeral: true });
        try {
          const settings = await SettingsService.getSettings(interaction.guildId);
          const categoryId = settings[`cat_${branch.toLowerCase()}`];
          const { voiceChannel } = await StudyChannelManager.createStudyGroup(interaction.guild, interaction.user, newValue, categoryId);
          if (interaction.member.voice.channel) await interaction.member.voice.setChannel(voiceChannel).catch(() => null);
          
          await interaction.editReply({ content: `✅ **Session Created!** You have been moved to **${voiceChannel.name}**.` });
          
          const dashboardEmbed = new EmbedBuilder()
            .setTitle(`📖 ${newValue} - Control Panel`)
            .setDescription('**Welcome to your temporary voice channel!**\nUse the menus below to manage your room settings and permissions.\n\n• Use drop-downs for all settings\n• Or use slash commands\n• Use `/toggle set` to disable this interface')
            .addFields(
              { name: 'Channel Owner', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Branch', value: `\`${branch}\``, inline: true }
            )
            .setColor(0x2B2D31).setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: 'StudyBot+ | Premium Management' });

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

          await voiceChannel.send({ embeds: [dashboardEmbed], components: [s1, s2, b1] });
        } catch (e) { await interaction.editReply(`❌ Error: ${e.message}`); }
      }

      else if (customId.startsWith('update_')) {
        const action = customId.split('_')[1];
        const session = await StudySession.findOne({ guildId: guild.id, isActive: 1, voice_channel_id: channelId });
        const voiceChannel = await guild.channels.fetch(session.voice_channel_id);
        
        if (action === 'name' || action === 'subject') await voiceChannel.setName(newValue);
        if (action === 'limit') await voiceChannel.setUserLimit(parseInt(newValue) || 0);
        if (action === 'status') await voiceChannel.setStatus(newValue);
        if (action === 'bitrate') await voiceChannel.setBitrate(parseInt(newValue) * 1000 || 64000);
        if (action === 'region') await voiceChannel.setRTCRegion(newValue === 'auto' ? null : newValue);
        
        if (action === 'permit' || action === 'invite') {
          const targetId = newValue.replace(/[<@!>]/g, '');
          await voiceChannel.permissionOverwrites.edit(targetId, { Connect: true, ViewChannel: true });
        }
        if (action === 'reject') {
          const targetId = newValue.replace(/[<@!>]/g, '');
          await voiceChannel.permissionOverwrites.edit(targetId, { Connect: false, ViewChannel: false });
          const m = await guild.members.fetch(targetId).catch(() => null);
          if (m && m.voice.channelId === voiceChannel.id) await m.voice.disconnect();
        }

        if (action === 'lfm') {
          const settings = await SettingsService.getSettings(guild.id);
          const lfmChan = await guild.channels.fetch(settings.lfm_channel_id).catch(() => null);
          if (lfmChan) {
            const lfmEmbed = new EmbedBuilder()
              .setTitle('📢 Study Session Looking for Members')
              .setDescription(`**${user.tag}** is looking for students to join their session!\n\n**Subject:** ${session.topic}\n**Message:** ${newValue}`)
              .addFields({ name: 'Join Room', value: `[Click to Join](${voiceChannel.url})` })
              .setColor(0xF1C40F).setTimestamp();
            await lfmChan.send({ content: '@everyone', embeds: [lfmEmbed] });
          }
        }
        await interaction.reply({ content: `✅ Updated **${action}** to: **${newValue}**`, ephemeral: true });
      }
    }
  },
};
