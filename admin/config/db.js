const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const caPath = path.join(__dirname, '../../ca.pem');
const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';
const sslOptions = (process.env.DB_SSL === 'true' || isRemote) && fs.existsSync(caPath)
    ? { ca: fs.readFileSync(caPath).toString() }
    : undefined;

const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'art',
    ...(sslOptions ? { ssl: sslOptions } : {})
});

db.connect((err) => {
    if (err) {
        console.log("Failed to Connect with DB !!", err.message || err);
    }
    else {
        console.log("Database connected SuccessFully ");
    }
});

module.exports = db;
