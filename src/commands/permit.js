const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const StudySession = require('../models/StudySession');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permit')
    .setDescription('Permit a user or role to access your study channel')
    .addUserOption(option => option.setName('user').setDescription('The user to permit'))
    .addRoleOption(option => option.setName('role').setDescription('The role to permit')),
  
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
    await voiceChannel.permissionOverwrites.edit(target.id, { Connect: true, ViewChannel: true });

    const embed = new EmbedBuilder()
      .setDescription(`✅ Permitted **${target.name || target.username}** to join the channel.`)
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed] });
  },
};
