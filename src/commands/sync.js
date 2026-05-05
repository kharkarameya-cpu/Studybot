const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const StudyChannelManager = require('../services/studyChannelManager');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Manually synchronize and update all active study room dashboards')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    await interaction.reply({ content: '🔄 Starting global synchronization...', ephemeral: true });

    try {
      await StudyChannelManager.refreshAllDashboards(interaction.client);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Synchronization Complete')
        .setDescription('All active study room dashboards have been updated to the latest UI version.')
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      logger.error(`Sync Error: ${error.message}`);
      await interaction.editReply({ content: `❌ Synchronization failed: ${error.message}` });
    }
  },
};
