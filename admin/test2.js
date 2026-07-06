const db = require('./config/db');
const q = `
                SELECT 
                    (SELECT COUNT(*) FROM user) as total,
                    (SELECT COUNT(*) FROM user WHERE is_online = TRUE) as online
`;
db.query(q, (err, rows) => {
    console.log(err, rows);
    process.exit();
});
