const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StudySession = require('../models/StudySession');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Change the status of your study voice channel')
    .addStringOption(option => 
      option.setName('text')
        .setDescription('The status text (max 500 chars)')
        .setRequired(true)),
  
  async execute(interaction) {
    const text = interaction.options.getString('text');
    
    const session = await StudySession.findOne({ 
      guildId: interaction.guild.id, 
      ownerId: interaction.user.id, 
      isActive: 1,
      voice_channel_id: interaction.channelId
    });

    if (!session) {
      return await interaction.reply({ content: '❌ You must be the owner of an active session here.', ephemeral: true });
    }

    const voiceChannel = await interaction.guild.channels.fetch(session.voice_channel_id);
    await voiceChannel.setStatus(text);

    const embed = new EmbedBuilder()
      .setDescription(`💬 Status updated to: **${text}**`)
      .setColor(0x3498DB);

    await interaction.reply({ embeds: [embed] });
  },
};
