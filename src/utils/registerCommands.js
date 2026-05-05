const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('./logger');

async function registerCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      // Skip search command if Drive credentials are missing
      if (command.data.name === 'search' && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        continue;
      }
      commands.push(command.data.toJSON());
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    logger.error(`Error registering commands: ${error.message}`);
  }
}

module.exports = registerCommands;

if (require.main === module) {
  require('dotenv').config();
  registerCommands();
}
