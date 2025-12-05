const express = require('express');
const path = require('path');
// const session = require('express-session'); // Removed unused dependency
const app = express();

// Simple in-memory session for this basic panel
let authenticatedSession = null;

module.exports = (client, logBuffer) => {
    const port = process.env.PORT || 3000;

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public'))); // For future css/js

    // Public Landing Page
    app.get('/', (req, res) => {
        res.render('landing', {
            clientId: process.env.CLIENT_ID
        });
    });

    // Legal Pages
    app.get('/tos', (req, res) => { res.render('tos'); });
    app.get('/privacy', (req, res) => { res.render('privacy'); });

    // Middleware to check auth
    const checkAuth = (req, res, next) => {
        // Simple cookie-less "session" check (relies on single user flow for simplicity, or we can use basic auth)
        // Let's use a simple cookie parser if we want it robust, but for a CLI bot tool:
        // We will use basic URL param or just a simple login form that sets a "cookie" manually or just logic.
        // Actually, 'express-session' is not installed in package.json. 
        // Let's use a really simple logic: if the user posts the password, we set a variable? No, that's bad for concurrency.
        // Let's stick to Basic Auth for maximum simplicity and reliability without extra deps.
        
        const auth = {login: 'admin', password: process.env.ADMIN_PASSWORD || 'admin'};
        const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
        const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

        if (login && password && login === auth.login && password === auth.password) {
            return next();
        }

        res.set('WWW-Authenticate', 'Basic realm="OrbitBot Admin"');
        res.status(401).send('Authentication required.');
    };

    app.get('/admin', checkAuth, (req, res) => {
        res.render('index', {
            user: client.user,
            stats: {
                servers: client.guilds.cache.size,
                channels: client.channels.cache.size,
                uptime: process.uptime(),
                ping: client.ws.ping
            },
            maintenance: client.maintenanceMode
        });
    });

    // API to get live logs and stats updates
    app.get('/admin/api/stats', checkAuth, (req, res) => {
        res.json({
            servers: client.guilds.cache.size,
            uptime: process.uptime(),
            ping: client.ws.ping,
            maintenance: client.maintenanceMode,
            logs: logBuffer
        });
    });

    // Action: Toggle Maintenance
    app.post('/admin/api/maintenance', checkAuth, (req, res) => {
        client.maintenanceMode = !client.maintenanceMode;
        console.log(`[Dashboard] Maintenance mode set to: ${client.maintenanceMode}`);
        res.json({ success: true, maintenance: client.maintenanceMode });
    });

    app.listen(port, () => {
        console.log(`Dashboard is running on http://localhost:${port}`);
    });
};
