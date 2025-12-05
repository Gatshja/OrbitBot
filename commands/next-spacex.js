const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('next-spacex')
		.setDescription('Displays information about the next SpaceX launch!'),
	async execute(interaction) {
        await interaction.deferReply();
        try {
            const response = await axios.get('https://api.spacexdata.com/v5/launches/next');
            const launch = response.data;

            if (!launch) {
                await interaction.editReply('Could not find information about the next SpaceX launch.');
                return;
            }

            const launchDate = new Date(launch.date_utc).toLocaleString();
            const launchPad = launch.launchpad || 'N/A';
            const rocketName = launch.rocket || 'N/A';

            const embed = new EmbedBuilder()
                .setColor(0x003366) // Dark blue for space
                .setTitle(`🚀 Next SpaceX Launch: ${launch.name}`)
                .setDescription(launch.details || 'No details available.')
                .addFields(
                    { name: 'Launch Date (UTC)', value: launchDate, inline: false },
                    { name: 'Flight Number', value: launch.flight_number.toString(), inline: true },
                    { name: 'Launchpad', value: launchPad, inline: true },
                    { name: 'Rocket', value: rocketName, inline: true },
                    { name: 'Mission Patch', value: launch.links?.patch?.small || 'N/A', inline: false },
                    { name: 'Webcast', value: launch.links?.webcast || 'N/A', inline: false },
                )
                .setThumbnail(launch.links?.patch?.small || null)
                .setTimestamp()
                .setFooter({ text: 'Data from SpaceX API' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Could not fetch the next SpaceX launch information.' });
        }
	},
};
