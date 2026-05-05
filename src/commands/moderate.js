const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const StudySession = require('../models/StudySession');
const StudyChannelManager = require('../services/studyChannelManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moderate')
    .setDescription('Moderation commands for study sessions')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(subcommand =>
      subcommand
        .setName('force_close')
        .setDescription('Forcefully close a study session')
        .addStringOption(option => option.setName('session_id').setDescription('The ID of the session').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list_active')
        .setDescription('List all active study sessions in this server')),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'force_close') {
      const sessionId = interaction.options.getString('session_id');
      const sessions = await StudySession.find({ id: sessionId, guild_id: interaction.guild.id });
      
      if (sessions.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setDescription('❌ Session not found.')
          .setColor(0xFF0000);
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      await StudyChannelManager.closeSession(sessions[0], interaction.guild);
      
      const successEmbed = new EmbedBuilder()
        .setTitle('🛡️ Moderation Action')
        .setDescription(`Session **${sessionId}** has been forcefully closed by ${interaction.user.tag}.`)
        .setColor(0xE74C3C)
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed] });
    } 
    
    else if (subcommand === 'list_active') {
      const sessions = await StudySession.find({ guild_id: interaction.guild.id, is_active: 1 });

      if (sessions.length === 0) {
        const infoEmbed = new EmbedBuilder()
          .setDescription('No active study sessions currently.')
          .setColor(0x3498DB);
        return await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('📊 Active Study Sessions')
        .setColor(0xF1C40F)
        .setDescription(sessions.map(s => `🔹 ID: \`${s.id}\` | **${s.topic}** (<@${s.owner_id}>)`).join('\n'))
        .setFooter({ text: `Total: ${sessions.length} active sessions` });

      await interaction.reply({ embeds: [embed] });
    }
  },
};
