const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const session = require('express-session');
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

// Static folder
app.use(express.static('public'));


// User public files
app.use(express.static(path.join(__dirname, 'public')));

// Shared uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        ca: fs.readFileSync(__dirname + '/../ca.pem').toString()
    }
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
    
    // Clear any stuck online sessions from previous run
    const db = require('./config/db');
    db.query("UPDATE user SET is_online = 0", (err) => {
        if (err) console.error("Failed to reset online status on startup", err);
        else console.log("Reset all online statuses to offline.");
    });

    // Initialize delivery reminder cron
    const { initDeliveryReminderCron } = require('./utils/deliveryReminderCron');
    initDeliveryReminderCron();
});