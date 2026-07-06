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

app.use(session({
    name: 'admin_session',
    secret: 'art-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use('/admin', adminRoutes);

app.listen(5070, () => {
    console.log("Server is Running on the PORT : 5070");
});