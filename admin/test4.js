const db = require('./config/db');
db.query("SELECT * FROM admin", (err, rows) => {
    console.log(rows);
    process.exit();
});
