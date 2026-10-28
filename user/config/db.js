const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const caPath = path.join(__dirname, '../../ca.pem');
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

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'art',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ...(sslOptions ? { ssl: sslOptions } : {})
});

pool.getConnection((err, conn) => {
    if (err) {
        console.log("Failed to Connect with DB !!", err.message || err);
    } else {
        console.log("Database connected SuccessFully ");
        conn.release();
    }
});

module.exports = pool;
