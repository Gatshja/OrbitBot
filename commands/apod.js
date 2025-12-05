const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('apod')
		.setDescription('Replies with NASA\'s Astronomy Picture of the Day!'),
	async execute(interaction) {
        await interaction.deferReply();
        try {
            const nasaApiKey = process.env.NASA_API_KEY;
            const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${nasaApiKey}`, { timeout: 5000 });
            const { title, url, hdurl, explanation, date } = response.data;

            const imageUrl = hdurl || url;

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`🌌 APOD: ${title}`)
                .setDescription(explanation)
                .setImage(imageUrl)
                .setTimestamp()
                .setFooter({ text: `Date: ${date} | Data from NASA APOD API` });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Could not fetch the Astronomy Picture of the Day.' });
        }
	},
};
