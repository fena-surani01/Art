const express = require('express');
const app = express();
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

app.use(session({
    name: 'user_session',
    secret: 'artwebsite',
    resave: false,
    saveUninitialized: false
}));

app.use('/', authRoutes);
app.use('/', artRoutes);
app.use('/', userRoutes);
app.use('/', cartRoutes);
app.use('/', artistRoutes);
app.use('/', checkoutRoutes);

app.listen(6070, () => {
    console.log("Server is Running on PORT : 6070");
    
    // Clear any stuck online sessions from previous run
    const db = require('./config/db');
    db.query("UPDATE user SET is_online = 0", (err) => {
        if (err) console.error("Failed to reset online status on startup", err);
        else console.log("Reset all online statuses to offline.");
    });
});