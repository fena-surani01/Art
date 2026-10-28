const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const fs = require('fs');
const session = require('express-session');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const uploadRoute = require("./routes/upload");
app.use("/api", uploadRoute);

const authRoutes = require('./routes/authRoutes');
const artRoutes = require('./routes/artRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const artistRoutes = require('./routes/artistRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folders
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images/arts', express.static(path.join(__dirname, 'public/images/arts')));
app.use('/arts', express.static(path.join(__dirname, 'public/images/arts')));
app.use(express.static(path.join(__dirname, 'public/images/arts')));

// Shared uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/arts', express.static(path.join(__dirname, '../uploads/arts')));

const MySQLStore = require('express-mysql-session')(session);

const caPath = path.join(__dirname, '../ca.pem');
const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';
const sslOptions = (process.env.DB_SSL === 'true' || isRemote) && fs.existsSync(caPath)
    ? { ca: fs.readFileSync(caPath).toString() }
    : undefined;

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'art',
    ...(sslOptions ? { ssl: sslOptions } : {})
});

app.use(session({
    name: 'user_session',
    secret: 'artwebsite',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.user = req.session ? req.session.user : null;
    next();
});

app.use('/', authRoutes);
app.use('/', artRoutes);
app.use('/', userRoutes);
app.use('/', cartRoutes);
app.use('/', artistRoutes);
app.use('/', checkoutRoutes);

// Socket.io unified chat integration
const automationEngine = require('./controller/automationEngine');
io.on('connection', (socket) => {
    socket.on('chatMessage', async (data) => {
        try {
            const msg = typeof data === 'object' ? data.text : data;
            const userId = typeof data === 'object' ? data.userId : null;
            const reply = await automationEngine.processMessage(msg, userId);
            socket.emit('botReply', reply);
        } catch (error) {
            console.error('Socket engine error:', error);
            socket.emit('botReply', 'Sorry, I ran into an issue.');
        }
    });
});

// Telegram Bot Integration
const telegramBot = require('./services/telegramBot');
telegramBot.initTelegramBot();

server.listen(6070, () => {
    console.log("Server is Running on PORT : 6070");
    
    // Auto-initialize required tables if missing
    const { initTables } = require('./config/initDb');
    initTables(() => {
        // Clear any stuck online sessions from previous run
        const db = require('./config/db');
        db.query("UPDATE user SET is_online = 0", (err) => {
            if (err) console.error("Failed to reset online status on startup", err.message || err);
            else console.log("Reset all online statuses to offline.");
        });

        // Initialize delivery reminder cron
        const { initDeliveryReminderCron } = require('./utils/deliveryReminderCron');
        initDeliveryReminderCron();
    });
});
