const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sun-now')
        .setDescription('Replies with the latest images of the sun from NOAA or Helioviewer.'),
    async execute(interaction) {
        const sunOptions = [
            {
                label: 'Sun (Green / 94 Å)',
                value: '94',
                color: 0x00FF00,
                primary_url: 'https://services.swpc.noaa.gov/images/animations/suvi/primary/094/latest.png',
                fallback_source_id: 8, // SDO/AIA 94
            },
            {
                label: 'Sun (Blue-Teal / 131 Å)',
                value: '131',
                color: 0x008080,
                primary_url: 'https://services.swpc.noaa.gov/images/animations/suvi/primary/131/latest.png',
                fallback_source_id: 9, // SDO/AIA 131
            },
            {
                label: 'Sun (Golden-Yellow / 171 Å)',
                value: '171',
                color: 0xFFBF00,
                primary_url: 'https://services.swpc.noaa.gov/images/animations/suvi/primary/171/latest.png',
                fallback_source_id: 10, // SDO/AIA 171
            },
            {
                label: 'Sun (Gold-Brown / 195 Å)',
                value: '195',
                color: 0xE1C16E,
                primary_url: 'https://services.swpc.noaa.gov/images/animations/suvi/primary/195/latest.png',
                fallback_source_id: 11, // SDO/AIA 193
            },
            {
                label: 'Sun (Purple / 284 Å)',
                value: '284',
                color: 0x800080,
                primary_url: 'https://services.swpc.noaa.gov/images/animations/suvi/primary/284/latest.png',
                fallback_source_id: 2, // SOHO/EIT 284
            },
            {
                label: 'Sun (Red-Orange / 304 Å)',
                value: '304',
                color: 0xD22B2B,
                primary_url: 'https://services.swpc.noaa.gov/images/animations/suvi/primary/304/latest.png',
                fallback_source_id: 13, // SDO/AIA 304
            },
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('sun-select')
            .setPlaceholder('Select a sun view')
            .addOptions(sunOptions.map(option => ({
                label: option.label,
                value: option.value,
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const initialEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('☀️ Select a Sun View')
            .setDescription('Please choose one of the sun views from the dropdown menu below.');

        const message = await interaction.reply({ embeds: [initialEmbed], components: [row] });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id && i.customId === 'sun-select',
            time: 60000, // 60 seconds
        });

        collector.on('collect', async i => {
            const selectedValue = i.values[0];
            const selectedSun = sunOptions.find(option => option.value === selectedValue);

            if (selectedSun) {
                await i.deferUpdate();
                let imageBuffer, apiSource;

                // Try primary API (NOAA)
                try {
                    const response = await axios.get(`${selectedSun.primary_url}?_=${Date.now()}`, { responseType: 'arraybuffer', timeout: 7000 });
                    imageBuffer = response.data;
                    apiSource = 'NOAA';
                } catch (error) {
                    console.log('Primary API failed, trying fallback (Helioviewer)...');
                    // Fallback to Helioviewer API
                    try {
                        const date = new Date().toISOString();
                        const metaResponse = await axios.get(`https://api.helioviewer.org/v2/getClosestImage/?date=${date}&sourceId=${selectedSun.fallback_source_id}&json=true`);
                        
                        const imageUrl = metaResponse.data.uri;
                        if (!imageUrl) throw new Error('Helioviewer did not return an image URI.');

                        const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
                        imageBuffer = response.data;
                        apiSource = 'Helioviewer';
                    } catch (fallbackError) {
                        console.error('Fallback API also failed:', fallbackError);
                        await i.editReply({ content: 'Could not fetch or process the sun image from either NOAA or Helioviewer.', components: [] });
                        return;
                    }
                }

                try {
                    const resizedImageBuffer = await sharp(imageBuffer)
                        .resize({ width: 1024, withoutEnlargement: true })
                        .png() // Explicitly convert to PNG to ensure Discord compatibility
                        .toBuffer();
                    const attachment = new AttachmentBuilder(resizedImageBuffer, { name: `${selectedSun.value}.png` });

                    const embed = new EmbedBuilder()
                        .setColor(selectedSun.color)
                        .setTitle(`☀️ ${selectedSun.label}`)
                        .setImage(`attachment://${selectedSun.value}.png`)
                        .setTimestamp()
                        .setFooter({ text: `Data from ${apiSource}` });

                    await i.editReply({ embeds: [embed], files: [attachment], components: [row] });
                } catch (processingError) {
                    console.error('Image processing error:', processingError);
                    await i.editReply({ content: 'Could not process the sun image.', components: [] });
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size > 0) {
                interaction.editReply({ components: [] }).catch(console.error);
            } else {
                interaction.editReply({ content: 'You did not make a selection in time.', embeds: [], components: [] }).catch(console.error);
            }
        });
    },
};
