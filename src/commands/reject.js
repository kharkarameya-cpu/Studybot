const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StudySession = require('../models/StudySession');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reject')
    .setDescription('Reject/kick a user or role from your study channel')
    .addUserOption(option => option.setName('user').setDescription('The user to reject'))
    .addRoleOption(option => option.setName('role').setDescription('The role to reject')),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const target = user || role;

    if (!target) return await interaction.reply({ content: 'Please specify a user or role.', ephemeral: true });

    const session = await StudySession.findOne({ 
      guildId: interaction.guild.id, 
      ownerId: interaction.user.id, 
      isActive: 1,
      voiceChannelId: interaction.channelId
    });

    if (!session) {
      return await interaction.reply({ content: '❌ You must be the owner of an active session here.', ephemeral: true });
    }

    const voiceChannel = await interaction.guild.channels.fetch(session.voice_channel_id);
    await voiceChannel.permissionOverwrites.edit(target.id, { Connect: false, ViewChannel: false });

    // Kick user if they are currently in the VC
    if (user) {
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (member && member.voice.channelId === voiceChannel.id) {
        await member.voice.disconnect();
      }
    }

    const embed = new EmbedBuilder()
      .setDescription(`🚫 Rejected **${target.name || target.username}** from the channel.`)
      .setColor(0xFF0000);

    await interaction.reply({ embeds: [embed] });
  },
};
