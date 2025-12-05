const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Lists all available commands.'),
	async execute(interaction) {
		const commands = interaction.client.commands;

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('Help - Command List')
			.setDescription('Here are all the commands you can use with OrbitBot:');

		commands.forEach(command => {
			if (command.data.name !== 'help') { // Exclude the help command itself
				embed.addFields({ name: `/${command.data.name}`, value: command.data.description });
			}
		});

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
