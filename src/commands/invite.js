const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StudySession = require('../models/StudySession');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Invite a user to your study voice channel')
    .addUserOption(option => option.setName('user').setDescription('The user to invite').setRequired(true)),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');

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
    const invite = await voiceChannel.createInvite({ maxAge: 3600, maxUses: 1 });

    await interaction.reply({ 
      content: `Hey <@${user.id}>! You've been invited to join the **${session.topic}** study session.`,
      embeds: [
        new EmbedBuilder()
          .setTitle('➕ Study Invitation')
          .setDescription(`Join the session here: ${invite.url}`)
          .setColor(0xF1C40F)
      ]
    });
  },
};
