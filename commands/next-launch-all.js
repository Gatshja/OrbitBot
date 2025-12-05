const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('next-launch-all')
		.setDescription('Displays information about the next upcoming space launch from any company!'),
	async execute(interaction) {
        await interaction.deferReply();
        try {
            const response = await axios.get('https://ll.thespacedevs.com/2.2.0/launch/upcoming/');
            const launches = response.data.results;

            if (!launches || launches.length === 0) {
                await interaction.editReply('Could not find information about any upcoming space launches.');
                return;
            }

            const nextLaunch = launches[0]; // Get the very next launch

            const launchDate = new Date(nextLaunch.net).toLocaleString(); // 'net' stands for No Earlier Than
            const launchPad = nextLaunch.pad ? nextLaunch.pad.name : 'N/A';
            const rocketName = nextLaunch.rocket ? nextLaunch.rocket.configuration.full_name : 'N/A';
            const missionName = nextLaunch.mission ? nextLaunch.mission.name : 'N/A';
            const missionDescription = nextLaunch.mission ? nextLaunch.mission.description : 'No mission description available.';

            const embed = new EmbedBuilder()
                .setColor(0x006666) // Teal color
                .setTitle(`🚀 Next Upcoming Launch: ${nextLaunch.name}`)
                .setDescription(missionDescription)
                .addFields(
                    { name: 'Launch Date (Local)', value: launchDate, inline: false },
                    { name: 'Rocket', value: rocketName, inline: true },
                    { name: 'Launchpad', value: launchPad, inline: true },
                    { name: 'Mission', value: missionName, inline: false },
                    { name: 'Status', value: nextLaunch.status.name, inline: true },
                    { name: 'Provider', value: nextLaunch.launch_service_provider.name, inline: true },
                )
                .setThumbnail(nextLaunch.image || null) // Use image if available
                .setTimestamp()
                .setFooter({ text: 'Data from Launch Library 2 API' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Could not fetch the next upcoming launch information.' });
        }
	},
};
