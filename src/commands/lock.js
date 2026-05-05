const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StudySession = require('../models/StudySession');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock your study voice channel'),
  
  async execute(interaction) {
    const session = await StudySession.findOne({ 
      guildId: interaction.guild.id, 
      ownerId: interaction.user.id, 
      isActive: 1,
      $or: [
        { voiceChannelId: interaction.channelId },
        { textChannelId: interaction.channelId }
      ]
    });

    if (!session) {
      const errorEmbed = new EmbedBuilder()
        .setDescription('❌ You are not the owner of an active study session in this channel.')
        .setColor(0xFF0000);
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const voiceChannel = await interaction.guild.channels.fetch(session.voice_channel_id);
    await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false });
    
    await StudySession.updateMetadata(session.id, { isLocked: true });

    const successEmbed = new EmbedBuilder()
      .setTitle('🔒 Channel Locked')
      .setDescription('Study voice channel is now locked to new participants.')
      .setColor(0xFFA500);

    await interaction.reply({ embeds: [successEmbed] });
  },
};
