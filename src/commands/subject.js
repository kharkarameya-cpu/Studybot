const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StudySession = require('../models/StudySession');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('subject')
    .setDescription('Change the subject of your current study session')
    .addStringOption(option => 
      option.setName('new_subject')
        .setDescription('The new subject name')
        .setRequired(true)),
  
  async execute(interaction) {
    const newSubject = interaction.options.getString('new_subject');
    
    const session = await StudySession.findOne({ 
      guildId: interaction.guild.id, 
      ownerId: interaction.user.id, 
      isActive: 1,
      voiceChannelId: interaction.channelId // User should be in/using the VC chat
    });

    if (!session) {
      const errorEmbed = new EmbedBuilder()
        .setDescription('❌ You must be the owner of an active study session to change the subject.')
        .setColor(0xFF0000);
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const voiceChannel = await interaction.guild.channels.fetch(session.voice_channel_id);
    await voiceChannel.setName(newSubject);
    
    // Update DB
    const sql = 'UPDATE study_sessions SET topic = ? WHERE id = ?';
    const d1 = require('../services/database');
    await d1.run(sql, [newSubject, session.id]);

    const successEmbed = new EmbedBuilder()
      .setTitle('📚 Subject Updated')
      .setDescription(`Subject has been changed to: **${newSubject}**`)
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [successEmbed] });
  },
};
