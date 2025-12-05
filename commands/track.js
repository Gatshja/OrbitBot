const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const satelliteMap = {
    'iss': 25544,
    'hubble': 20580, // Hubble Space Telescope
    'jwst': 49954,   // James Webb Space Telescope
    'starlink': 44238, // Example Starlink satellite (there are many)
    'tiangong': 48274 // Tiangong Space Station
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('track')
		.setDescription('Tracks a satellite by its NORAD ID or common name (defaults to ISS).')
        .addStringOption(option => 
            option.setName('satellite')
                .setDescription('The NORAD ID (e.g., 25544) or name (e.g., "ISS", "Hubble") of the satellite.')
                .setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();
		try {
            let satId;
            const input = interaction.options.getString('satellite');

            if (input) {
                // Check if input is a number (NORAD ID)
                if (!isNaN(input) && !isNaN(parseFloat(input))) {
                    satId = parseInt(input);
                } else {
                    // Try to find the name in the map
                    const lowerCaseInput = input.toLowerCase();
                    if (satelliteMap[lowerCaseInput]) {
                        satId = satelliteMap[lowerCaseInput];
                    } else {
                        await interaction.editReply(`Could not find a NORAD ID for "${input}". Please provide a valid NORAD ID or a recognized satellite name.`);
                        return;
                    }
                }
            } else {
                satId = 25544; // Default to ISS if no input
            }
            
            const apiKey = process.env.N2YO_API_KEY;
            
            const apiUrl = `https://api.n2yo.com/rest/v1/satellite/positions/${satId}/0/0/0/1/&apiKey=${apiKey}`;
            
			const response = await axios.get(apiUrl, { timeout: 10000 });
            const data = response.data;

			if (!data || !data.positions || data.positions.length === 0) {
				await interaction.editReply(`Could not find tracking information for satellite ID ${satId}. It might be invalid or deorbited.`);
				return;
			}

            const position = data.positions[0];
            const info = data.info;
            
            const lat = position.satlatitude;
            const lng = position.satlongitude;
            const name = info.satname || `Satellite ${satId}`;

            const mapUrl = `https://api-m.locationn.site/map?lat=${lat}&lng=${lng}&zoom=3&style=osm&width=640&height=360&marker=true`;

			const embed = new EmbedBuilder()
				.setColor(0x00FF00) // Green
				.setTitle(`🛰️ Tracking: ${name}`)
                .setDescription(`Current position of satellite ID: ${satId}`)
                .addFields(
                    { name: 'Latitude', value: lat.toString(), inline: true },
                    { name: 'Longitude', value: lng.toString(), inline: true },
                    { name: 'Altitude', value: `${position.sataltitude} km`, inline: true },
                    { name: 'Azimuth', value: `${position.azimuth}°`, inline: true },
                    { name: 'Elevation', value: `${position.elevation}°`, inline: true },
                    { name: 'RA', value: `${position.ra}°`, inline: true },
                )
                .setImage(mapUrl)
				.setTimestamp()
				.setFooter({ text: 'Data from N2YO API & Locationn Static Maps' });

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: 'An error occurred while tracking the satellite.' });
		}
	},
};
