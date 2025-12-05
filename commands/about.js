const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Replies with information about OrbitBot!'),
	async execute(interaction) {
		await interaction.reply(`**OrbitBot** is a Discord bot dedicated to providing fascinating space-related data and information.

**Owners:**
- Armsix Production
- Robloxbot Team`);
	},
};