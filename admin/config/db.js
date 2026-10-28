const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL;

const caPath = path.join(__dirname, '../../ca.pem');
const host = process.env.DB_HOST || '127.0.0.1';
const isRemote = Boolean(connectionUri) || (host !== 'localhost' && host !== '127.0.0.1');

let sslOptions = undefined;
if (process.env.DB_SSL === 'false') {
    sslOptions = undefined;
} else if (isRemote || process.env.DB_SSL === 'true') {
    const isAiven = (connectionUri && connectionUri.includes('aiven')) || (host && host.includes('aiven')) || process.env.DB_USE_CA === 'true';
    if (isAiven && fs.existsSync(caPath)) {
        sslOptions = {
            ca: fs.readFileSync(caPath).toString(),
            rejectUnauthorized: false
        };
    } else {
        sslOptions = {
            rejectUnauthorized: false
        };
    }
}

let poolConfig;
if (connectionUri) {
    poolConfig = {
        uri: connectionUri,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        ...(sslOptions ? { ssl: sslOptions } : {})
    };
} else {
    poolConfig = {
        host: host,
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
    };
}

const pool = mysql.createPool(poolConfig);

pool.getConnection((err, conn) => {
    if (err) {
        console.error("❌ Failed to connect to MySQL database:", err.message);
        console.error("   Target Host:", connectionUri ? 'DATABASE_URL' : `${host}:${process.env.DB_PORT || 3306}`);
    } else {
        console.log("✅ Database connected successfully to:", connectionUri ? 'DATABASE_URL' : host);
        conn.release();
    }
});

module.exports = pool;
