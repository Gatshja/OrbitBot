const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const solarSystemApiKey = process.env.SOLAR_SYSTEM_API_KEY;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('planet-info')
		.setDescription('Displays information about a specific planet!')
        .addStringOption(option =>
            option.setName('planet')
                .setDescription('The name of the planet to get information about')
                .setRequired(true)
                .setAutocomplete(true)), // Enable autocomplete for planet names
	async execute(interaction) {
        await interaction.deferReply();
        try {
            const planetName = interaction.options.getString('planet');
            const response = await axios.get(`https://api.le-systeme-solaire.net/rest/bodies/${encodeURIComponent(planetName)}`, {
                headers: { 'Authorization': `Bearer ${solarSystemApiKey}` }
            });
            const planet = response.data;

            if (!planet || planet.isPlanet === false) { // API returns isPlanet: false for dwarf planets like Pluto
                await interaction.editReply(`Could not find information for planet "${planetName}".`);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0xCCCCFF) // Light purple/blue
                .setTitle(`🪐 ${planet.englishName} Information`)
                .addFields(
                    { name: 'Diameter', value: `${planet.meanRadius ? (planet.meanRadius * 2).toLocaleString() : 'N/A'} km`, inline: true },
                    { name: 'Distance from Sun (AU)', value: `${planet.perihelion ? (planet.perihelion / 149597870.7).toFixed(2) : 'N/A'}`, inline: true }, // Convert km to AU
                    { name: 'Moons', value: planet.moons ? planet.moons.length.toString() : '0', inline: true },
                    { name: 'Gravity', value: `${planet.gravity ? planet.gravity.toFixed(2) : 'N/A'} m/s²`, inline: true },
                    { name: 'Density', value: `${planet.density ? planet.density.toFixed(2) : 'N/A'} g/cm³`, inline: true },
                    { name: 'Orbital Period', value: `${planet.sideralOrbit ? (planet.sideralOrbit / 365.25).toFixed(2) : 'N/A'} Earth years`, inline: true } // Convert days to Earth years
                )
                .setTimestamp()
                .setFooter({ text: 'Data from Solar System OpenData API' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 401) {
                await interaction.editReply('The API key is missing or invalid. Please make sure you have a valid `SOLAR_SYSTEM_API_KEY` in your `.env` file.');
            } else if (error.response && error.response.status === 404) {
                await interaction.editReply(`Could not find information for that planet.`);
            } else {
                await interaction.editReply({ content: 'Could not retrieve planet information from the API.' });
            }
        }
	},
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        try {
            const response = await axios.get('https://api.le-systeme-solaire.net/rest/bodies/', {
                headers: { 'Authorization': `Bearer ${solarSystemApiKey}` }
            });
            const bodies = response.data.bodies.filter(body => body.isPlanet || body.id === 'pluton'); // Include Pluto
            const choices = bodies.map(body => body.englishName || body.name);
            const filtered = choices.filter(choice => choice.toLowerCase().startsWith(focusedValue.toLowerCase()));
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );
        } catch (error) {
            console.error('Error fetching autocomplete data:', error);
            await interaction.respond([]);
        }
    },
};
