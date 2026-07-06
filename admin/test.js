const db = require('./config/db');
const q = `
                SELECT 
                    (SELECT COUNT(*) FROM artists) as total,
                    (SELECT COUNT(*) FROM artists WHERE is_online = TRUE) as online,
                    (SELECT COUNT(*) FROM artist_attendance WHERE date = CURDATE() AND status = 'Present' AND last_break_time IS NULL) as present,
                    (SELECT COUNT(*) FROM artist_attendance WHERE date = CURDATE() AND last_break_time IS NOT NULL) as on_break,
                    (SELECT COUNT(*) FROM artist_attendance WHERE date = CURDATE() AND status IN ('Leave', 'Absent')) as full_leave,
                    (SELECT COUNT(*) FROM artist_attendance WHERE date = CURDATE() AND status = 'Half Day') as half_leave
`;
db.query(q, (err, rows) => {
    console.log(err, rows);
    process.exit();
});
