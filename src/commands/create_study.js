const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  EmbedBuilder 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create_study')
    .setDescription('Start a new study session (Branch & Subject selection)'),
  
  async execute(interaction) {
    const branchMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_branch')
        .setPlaceholder('Step 1: Choose your Branch')
        .addOptions([
          { label: 'CE', description: 'Computer Engineering', value: 'CE', emoji: '💻' },
          { label: 'CSE', description: 'Computer Science & Engineering', value: 'CSE', emoji: '🖥️' },
          { label: 'MECHANICAL', description: 'Mechanical Engineering', value: 'MECHANICAL', emoji: '⚙️' },
          { label: 'OTHER', description: 'Other Branches', value: 'OTHER', emoji: '📚' },
        ])
    );

    const embed = new EmbedBuilder()
      .setTitle('📖 Create Study Session')
      .setDescription('Please select your **Branch** from the dropdown below to proceed to the subject entry.')
      .setColor(0x3498DB);

    await interaction.reply({ embeds: [embed], components: [branchMenu], ephemeral: true });
  },
};
