const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('space-search')
		.setDescription('Search for images in the NASA Image and Video Library')
		.addStringOption(option =>
			option.setName('query')
				.setDescription('The search term (e.g., "Apollo 11", "Mars", "Black Hole")')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		try {
			const query = interaction.options.getString('query');
			// We filter by media_type=image to ensure we get something we can display in an embed
			const response = await axios.get(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`, { timeout: 10000 });

			const items = response.data.collection.items;

			if (!items || items.length === 0) {
				await interaction.editReply(`No images found for "${query}".`);
				return;
			}

			// Take the first result
			const item = items[0];
			const itemData = item.data[0];
			const itemLink = item.links ? item.links.find(link => link.render === 'image') || item.links[0] : null;

			if (!itemLink) {
				await interaction.editReply(`Found results for "${query}", but could not extract an image.`);
				return;
			}

			const description = itemData.description 
				? (itemData.description.length > 4096 ? itemData.description.substring(0, 4093) + '...' : itemData.description)
				: 'No description available.';

			const embed = new EmbedBuilder()
				.setColor(0x0B3D91) // NASA Blue
				.setTitle(itemData.title)
				.setDescription(description)
				.setImage(itemLink.href)
				.setTimestamp(new Date(itemData.date_created))
				.setFooter({ text: 'Data from NASA Image and Video Library' });

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: 'An error occurred while searching the NASA library.' });
		}
	},
};
