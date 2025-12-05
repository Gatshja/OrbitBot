const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('satellite-view')
        .setDescription('Replies with the latest satellite images of Earth.'),
    async execute(interaction) {
        const satelliteOptions = [
            {
                label: 'Earth (Asia/Australia View)',
                value: 'asia-australia',
                url: 'https://rammb.cira.colostate.edu/ramsdis/online/images/latest/himawari-8/full_disk_ahi_true_color.jpg',
            },
            {
                label: 'Earth (Americas View)',
                value: 'americas',
                url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/latest.jpg',
            },
            {
                label: 'Earth (Pacific Ocean View)',
                value: 'pacific',
                url: 'https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/latest.jpg',
            },
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('satellite-select')
            .setPlaceholder('Select a satellite view')
            .addOptions(satelliteOptions.map(option => ({
                label: option.label,
                value: option.value,
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const initialEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🛰️ Select a Satellite View')
            .setDescription('Please choose one of the satellite views from the dropdown menu below.');

        const message = await interaction.reply({ embeds: [initialEmbed], components: [row] });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id && i.customId === 'satellite-select',
            time: 60000, // 60 seconds
        });

        collector.on('collect', async i => {
            const selectedValue = i.values[0];
            const selectedSatellite = satelliteOptions.find(option => option.value === selectedValue);

            if (selectedSatellite) {
                try {
                    await i.deferUpdate();
                    const response = await axios.get(`${selectedSatellite.url}?_=${Date.now()}`, { responseType: 'arraybuffer' });
                    const resizedImageBuffer = await sharp(response.data)
                        .resize({ width: 1024, withoutEnlargement: true })
                        .toBuffer();
                    const attachment = new AttachmentBuilder(resizedImageBuffer, { name: `${selectedSatellite.value}.jpg` });

                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`🛰️ ${selectedSatellite.label}`)
                        .setImage(`attachment://${selectedSatellite.value}.jpg`)
                        .setTimestamp()
                        .setFooter({ text: 'Data from NOAA/CIRA/RAMMB' });

                    await i.editReply({ embeds: [embed], files: [attachment], components: [row] });
                } catch (error) {
                    console.error(error);
                    await i.editReply({ content: 'Could not fetch or process the satellite image.', components: [] });
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size > 0) {
                interaction.editReply({ components: [] });
            } else {
                interaction.editReply({ content: 'You did not make a selection in time.', embeds: [], components: [] });
            }
        });
    },
};
