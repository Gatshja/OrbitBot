const fs = require('fs');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { spawn } = require('child_process');
require('dotenv').config();

// --- Log Capturing for Dashboard ---
const logBuffer = [];
const MAX_LOGS = 50;

function addToLogBuffer(type, args) {
    const msg = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
    const time = new Date().toLocaleTimeString();
    logBuffer.push({ type, time, msg });
    if (logBuffer.length > MAX_LOGS) logBuffer.shift();
}

// Override console.log
const originalLog = console.log;
console.log = (...args) => {
    addToLogBuffer('info', args);
    originalLog.apply(console, args);
};

// Override console.error
const originalError = console.error;
console.error = (...args) => {
    addToLogBuffer('error', args);
    originalError.apply(console, args);
};
// -----------------------------------

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.maintenanceMode = false; // Global maintenance state

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
	console.log('Ready!');
    // Start the Dashboard
    try {
        require('./dashboard/dashboard')(client, logBuffer);
    } catch (e) {
        console.error('Failed to start dashboard:', e);
    }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

    // Maintenance Mode Check
    if (client.maintenanceMode) {
        // You can add an exception for admin IDs here if you want
        return interaction.reply({
            content: '⚠️ **Maintenance Mode**\nThe bot is currently undergoing maintenance. Please try again later.', 
            ephemeral: true 
        });
    }

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

function startCloudflared() {
    const token = process.env.CLOUDFLARE_TUNNEL_TOKEN;
    if (!token) {
        console.error('Cloudflare Tunnel token is not set. Please set CLOUDFLARE_TUNNEL_TOKEN in your .env file.');
        return;
    }

    console.log('Starting Cloudflare Tunnel...');
    const tunnel = spawn('cloudflared', ['tunnel', '--no-autoupdate', 'run', '--token', token]);

    tunnel.stdout.on('data', (data) => {
        // We don't push raw tunnel logs to the buffer to avoid spamming the dashboard, 
        // but you can uncomment the next line if you want them. 
        // console.log(`[cloudflared] ${data}`); 
        process.stdout.write(`[cloudflared] ${data}`); // Print to terminal only
    });

    tunnel.stderr.on('data', (data) => {
         process.stderr.write(`[cloudflared error] ${data}`);
    });

    tunnel.on('close', (code) => {
        console.log(`Cloudflare Tunnel process exited with code ${code}`);
    });

    tunnel.on('error', (err) => {
        console.error('Failed to start Cloudflare Tunnel:', err);
    });
}

startCloudflared();
client.login(process.env.DISCORD_TOKEN);