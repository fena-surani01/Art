const mysql = require('mysql2');
require('dotenv').config();
const fs = require('fs');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        ca: fs.readFileSync(__dirname + '/../../ca.pem').toString()
    }
});

db.connect((err) => {
    if (err) {
        console.log("Failed to Connect with DB !!");
    }
    else {
        console.log("Database connected SuccessFully ")
    }
})
module.exports = db;