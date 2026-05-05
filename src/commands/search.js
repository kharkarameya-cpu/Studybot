const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DriveService = require('../services/drive');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for study materials in Google Drive')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('The search term')
        .setRequired(true)),
  
  async execute(interaction) {
    const query = interaction.options.getString('query');
    
    await interaction.deferReply();

    try {
      const files = await DriveService.searchFiles(query);

      if (files.length === 0) {
        return await interaction.editReply(`No files found for "${query}".`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`Search Results for: ${query}`)
        .setColor(0x00AE86)
        .setDescription(files.map(f => `📄 [${f.name}](${f.webViewLink})`).join('\n'))
        .setFooter({ text: 'Powered by Google Drive' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply(`❌ Error searching Drive: ${error.message}`);
    }
  },
};
