const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moon-arts')
        .setDescription('Displays an artistic representation of the moon.'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const imageUrl = `https://wttr.in/Moon.png?anticache=${Date.now()}`;
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

            const attachment = new AttachmentBuilder(response.data, { name: 'moon.png' });

            const embed = new EmbedBuilder()
                .setColor(0x808080) // Grey color for moon
                .setTitle('🌕 Moon Arts')
                .setDescription('Here is an artistic representation of the moon:')
                .setImage('attachment://moon.png')
                .setTimestamp()
                .setFooter({ text: 'Data from wttr.in' });

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Could not fetch the moon image.' });
        }
    },
};
