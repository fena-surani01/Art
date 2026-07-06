const db = require('./config/db');
db.query("DESCRIBE custom_requests", (err, res1) => {
    console.log(res1);
    process.exit();
});
