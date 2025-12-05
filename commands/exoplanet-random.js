const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exoplanet-random')
		.setDescription('Fetches a random exoplanet from the NASA Exoplanet Archive!'),
	async execute(interaction) {
		await interaction.deferReply();
		try {
            // Querying for top 100 to pick a random one from the list to ensure variety.
            // Added hostname and disc_year for better context.
			const query = "select top 100 pl_name,sy_dist,hostname,disc_year from ps where sy_dist is not null";
            const apiUrl = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(query)}&format=json`;
            
			const response = await axios.get(apiUrl, { timeout: 10000 });
			const planets = response.data;

			if (!planets || planets.length === 0) {
				await interaction.editReply('No exoplanets found.');
				return;
			}

            // Pick a random planet from the returned list
			const randomPlanet = planets[Math.floor(Math.random() * planets.length)];

            const distanceParsecs = randomPlanet.sy_dist;
            const distanceLightYears = (distanceParsecs * 3.26156).toFixed(2); // Convert Parsecs to Light Years

			const embed = new EmbedBuilder()
				.setColor(0xFF4500) // Orange-Red
				.setTitle(`🪐 Random Exoplanet: ${randomPlanet.pl_name}`)
				.addFields(
                    { name: 'Host Star', value: randomPlanet.hostname || 'Unknown', inline: true },
                    { name: 'Discovery Year', value: randomPlanet.disc_year ? randomPlanet.disc_year.toString() : 'Unknown', inline: true },
                    { name: 'Distance', value: `${distanceParsecs} pc (${distanceLightYears} ly)`, inline: false }
                )
				.setTimestamp()
				.setFooter({ text: 'Data from NASA Exoplanet Archive' });

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: 'An error occurred while fetching exoplanet data.' });
		}
	},
};
