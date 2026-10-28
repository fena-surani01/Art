const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const uploadRoute = require("./routes/upload");
app.use("/api", uploadRoute);

const adminRoutes = require('./routes/adminRoutes');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Admin public files (CSS/JS/images)
app.use('/admin', express.static(path.join(__dirname, 'public')));
app.use('/images/arts', express.static(path.join(__dirname, '../user/public/images/arts')));
app.use('/arts', express.static(path.join(__dirname, '../user/public/images/arts')));
app.use(express.static(path.join(__dirname, '../user/public/images/arts')));

// Shared uploads folder (outside admin)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/arts', express.static(path.join(__dirname, '../uploads/arts')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const MySQLStore = require('express-mysql-session')(session);

const caPath = path.join(__dirname, '../ca.pem');
const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

let sslOptions = undefined;
if (process.env.DB_SSL === 'false') {
    sslOptions = undefined;
} else if (isRemote || process.env.DB_SSL === 'true') {
    if (fs.existsSync(caPath)) {
        sslOptions = {
            ca: fs.readFileSync(caPath).toString(),
            rejectUnauthorized: false
        };
    } else {
        sslOptions = { rejectUnauthorized: false };
    }
}

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'art',
    createDatabaseTable: true,
    ...(sslOptions ? { ssl: sslOptions } : {})
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
