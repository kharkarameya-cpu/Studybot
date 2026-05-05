const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StudySession = require('../models/StudySession');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limit')
    .setDescription('Set the user limit for your study voice channel')
    .addIntegerOption(option => 
      option.setName('limit')
        .setDescription('Maximum number of users (0-99)')
        .setMinValue(0)
        .setMaxValue(99)
        .setRequired(true)),
  
  async execute(interaction) {
    const limit = interaction.options.getInteger('limit');
    
    const session = await StudySession.findOne({ 
      guildId: interaction.guild.id, 
      ownerId: interaction.user.id, 
      isActive: 1,
      voiceChannelId: interaction.channelId
    });

    if (!session) {
      const errorEmbed = new EmbedBuilder()
        .setDescription('❌ You must be the owner of an active study session to set a limit.')
        .setColor(0xFF0000);
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const voiceChannel = await interaction.guild.channels.fetch(session.voice_channel_id);
    await voiceChannel.setUserLimit(limit);
    
    // Update DB
    await StudySession.updateMetadata(session.id, { userLimit: limit, isLocked: session.is_locked });

    const successEmbed = new EmbedBuilder()
      .setTitle('👥 User Limit Set')
      .setDescription(`The user limit for this channel is now set to: **${limit === 0 ? 'Unlimited' : limit}**`)
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [successEmbed] });
  },
};
