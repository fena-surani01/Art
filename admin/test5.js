const db = require('./config/db');
db.query("DESCRIBE custom_requests", (err, res1) => {
    console.log("custom_requests schema:");
    console.log(res1);
    db.query("DESCRIBE orders", (err, res2) => {
        console.log("orders schema:");
        console.log(res2);
        process.exit();
    });
});
