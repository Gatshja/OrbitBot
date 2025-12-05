const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whos-in-space')
		.setDescription('Displays the list of astronauts currently in space!'),
	async execute(interaction) {
        await interaction.deferReply();
        try {
            const response = await axios.get('http://api.open-notify.org/astros.json');
            const astronauts = response.data.people;
            const astronautCount = response.data.number;

            let astronautList = 'No astronauts currently in space.';
            if (astronautCount > 0) {
                astronautList = astronauts.map(astro => `• ${astro.name} (${astro.craft})`).join('\n');
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`🧑‍🚀 People in Space Right Now (${astronautCount})`)
                .setDescription(astronautList)
                .setTimestamp()
                .setFooter({ text: 'Data from Open Notify API' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Could not fetch astronaut data.' });
        }
	},
};
