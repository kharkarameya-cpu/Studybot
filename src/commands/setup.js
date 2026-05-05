const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const SettingsService = require('../services/settingsService');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Intelligently setup or repair study categories and channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    await interaction.reply({ content: '🔍 Scanning server and repairing configuration...', ephemeral: true });

    try {
      const branches = ['CE', 'CSE', 'MECHANICAL', 'OTHER'];
      const currentSettings = await SettingsService.getSettings(interaction.guild.id) || {};
      const categories = {};
      let lfmChannelId = currentSettings.lfm_channel_id;

      // 1. Check/Repair Categories
      for (const branch of branches) {
        const storedId = currentSettings[`cat_${branch.toLowerCase()}`];
        let category = storedId ? await interaction.guild.channels.fetch(storedId).catch(() => null) : null;

        if (!category) {
          logger.info(`Creating missing category: ${branch}`);
          category = await interaction.guild.channels.create({
            name: branch,
            type: ChannelType.GuildCategory,
          });
        }
        categories[branch] = category.id;
      }

      // 2. Check/Repair LFM Channel
      let lfmChannel = lfmChannelId ? await interaction.guild.channels.fetch(lfmChannelId).catch(() => null) : null;
      if (!lfmChannel) {
        logger.info('Creating missing LFM channel');
        lfmChannel = await interaction.guild.channels.create({
          name: '📢-lfm-announcements',
          type: ChannelType.GuildText,
          topic: 'Public announcements for study sessions looking for members',
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone,
              deny: [PermissionFlagsBits.SendMessages],
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
            }
          ]
        });
        lfmChannelId = lfmChannel.id;
      }

      // 3. Save Final State
      await SettingsService.setBranchCategories(interaction.guild.id, categories, lfmChannelId);

      const embed = new EmbedBuilder()
        .setTitle('✅ Smart Setup Complete')
        .setDescription('I have checked your server and ensured all required categories and channels are present.')
        .addFields(
          { name: 'Status', value: 'All systems are synchronized and repaired.', inline: false },
          { name: 'LFM Channel', value: `<#${lfmChannelId}>`, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      logger.error(`Smart Setup Error: ${error.message}`);
      await interaction.editReply({ content: `❌ Setup failed: ${error.message}` });
    }
  },
};
