const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const uploadRoute = require("./routes/upload");
app.use("/api", uploadRoute);


const adminRoutes = require('./routes/adminRoutes');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Admin public files (CSS/JS/images)
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public')));

// Shared uploads folder (outside admin)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
    name: 'admin_session',
    secret: 'art-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

app.use('/admin', adminRoutes);

app.listen(5070, () => {
    console.log("Server is Running on the PORT : 5070");
});