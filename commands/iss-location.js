const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('iss-location')
		.setDescription('Replies with the current location of the ISS!'),
	async execute(interaction) {
        await interaction.deferReply();
        try {
            let latitude, longitude, apiSource;
            try {
                const response = await axios.get('http://api.open-notify.org/iss-now.json', { timeout: 5000 });
                latitude = response.data.iss_position.latitude;
                longitude = response.data.iss_position.longitude;
                apiSource = 'Open Notify API';
            } catch (error) {
                console.log('Open Notify API failed, trying fallback API...');
                const fallbackResponse = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 5000 });
                latitude = fallbackResponse.data.latitude;
                longitude = fallbackResponse.data.longitude;
                apiSource = 'Where The ISS At API';
            }

            const mapUrl = `https://iss-sm.locationn.site/iss-map.png?lat=${latitude}&lon=${longitude}&secret=${Date.now()}`;

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🛰️ International Space Station Location')
                .setDescription(`Current coordinates of the ISS:`)
                .addFields(
                    { name: 'Latitude', value: String(latitude), inline: true },
                    { name: 'Longitude', value: String(longitude), inline: true },
                )
                .setImage(mapUrl)
                .setTimestamp()
                .setFooter({ text: `Data from ${apiSource}` });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Could not fetch ISS location from both primary and fallback APIs.' });
        }
	},
};
