const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('space-news')
		.setDescription('Fetches the latest 5 space news articles.'),
	async execute(interaction) {
		await interaction.deferReply();
		try {
			const response = await axios.get('https://api.spaceflightnewsapi.net/v4/articles?limit=5', { timeout: 10000 });
			const articles = response.data.results;

			if (!articles || articles.length === 0) {
				await interaction.editReply('No news articles found.');
				return;
			}

			const embed = new EmbedBuilder()
				.setColor(0x2E86C1)
				.setTitle('📰 Latest Space News')
				.setTimestamp()
				.setFooter({ text: 'Data from Spaceflight News API' });

			articles.forEach(article => {
				const publishedDate = new Date(article.published_at);
				const discordTimestamp = Math.floor(publishedDate.getTime() / 1000);
				
				embed.addFields({
					name: article.title,
					value: `**Source:** ${article.news_site}\n[Read Article](${article.url})\nPublished <t:${discordTimestamp}:R>`
				});
			});

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: 'Could not fetch space news.' });
		}
	},
};
