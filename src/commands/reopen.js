const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StudySession = require('../models/StudySession');
const StudyChannelManager = require('../services/studyChannelManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reopen')
    .setDescription('Reopen a previously closed study session')
    .addStringOption(option => 
      option.setName('subject')
        .setDescription('The subject of the session to reopen')
        .setRequired(true)),
  
  async execute(interaction) {
    const subject = interaction.options.getString('subject');
    
    await interaction.deferReply({ ephemeral: true });

    // Find inactive session within 24h
    const session = await StudySession.findOne({
      guildId: interaction.guild.id,
      ownerId: interaction.user.id,
      topic: subject,
      isActive: 0,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Session Not Found')
        .setDescription('No eligible session found to reopen. Sessions expire after 24 hours or must have been closed previously.')
        .setColor(0xFF0000);
      return await interaction.editReply({ embeds: [errorEmbed] });
    }

    try {
      const { voiceChannel } = await StudyChannelManager.createStudyGroup(
        interaction.guild,
        interaction.user,
        subject
      );

      const successEmbed = new EmbedBuilder()
        .setTitle('🔄 Session Reopened')
        .setDescription(`The study group for **${subject}** has been restored.`)
        .addFields({ name: 'Subject', value: `\`${subject}\``, inline: true })
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error Reopening')
        .setDescription(error.message)
        .setColor(0xFF0000);
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
