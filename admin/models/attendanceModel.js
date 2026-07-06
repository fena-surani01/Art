const db = require('../config/db');

// Create the attendance table if it doesn't exist
const createAttendanceTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS artist_attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            artist_id INT NOT NULL,
            date DATE NOT NULL,
            status ENUM('Present', 'Absent', 'Half Day', 'Leave') DEFAULT 'Present',
            last_check_in DATETIME DEFAULT NULL,
            first_check_in DATETIME DEFAULT NULL,
            last_break_time DATETIME DEFAULT NULL,
            total_worked_seconds INT DEFAULT 0,
            total_break_seconds INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE,
            UNIQUE KEY unique_attendance_date (artist_id, date)
        )
    `;
    db.query(query, (err) => {
        if (err) console.error("Error creating artist_attendance table:", err);
        else {
            const logsQuery = `
                CREATE TABLE IF NOT EXISTS artist_attendance_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    attendance_id INT NOT NULL,
                    action ENUM('Check In', 'Break/Check Out') NOT NULL,
                    time DATETIME NOT NULL,
                    FOREIGN KEY (attendance_id) REFERENCES artist_attendance(id) ON DELETE CASCADE
                )
            `;
            db.query(logsQuery, (err) => {
                if (err) console.error("Error creating artist_attendance_logs table:", err);
                else console.log("Attendance tables ready.");
            });
        }
    });
};

createAttendanceTable();

class AttendanceModel {
    
    // Check if attendance exists for an artist today
    static getTodayAttendance(artistId, callback) {
        const query = `SELECT * FROM artist_attendance WHERE artist_id = ? AND date = CURDATE()`;
        db.query(query, [artistId], (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results[0] || null);
        });
    }

    // Get Weekly Attendance for an artist (last 7 days)
    static getWeeklyAttendance(artistId, callback) {
        const query = `
            SELECT * FROM artist_attendance 
            WHERE artist_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            ORDER BY date DESC
        `;
        db.query(query, [artistId], (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    }

    // Mark check-in for today
    static checkIn(artistId, callback) {
        this.getTodayAttendance(artistId, (err, existing) => {
            if (err) return callback(err);
            if (existing && existing.last_check_in) {
                return callback(null, { alreadyCheckedIn: true });
            }

            if (!existing) {
                const insertQuery = `
                    INSERT INTO artist_attendance (artist_id, date, status, last_check_in, first_check_in) 
                    VALUES (?, CURDATE(), 'Present', NOW(), NOW())
                `;
                db.query(insertQuery, [artistId], (err, results) => {
                    if (err) return callback(err);
                    const logQuery = `INSERT INTO artist_attendance_logs (attendance_id, action, time) VALUES (?, 'Check In', NOW())`;
                    db.query(logQuery, [results.insertId]);
                    callback(null, { success: true });
                });
            } else {
                const updateQuery = `
                    UPDATE artist_attendance 
                    SET last_check_in = NOW(),
                        total_break_seconds = total_break_seconds + IF(last_break_time IS NOT NULL, TIMESTAMPDIFF(SECOND, last_break_time, NOW()), 0),
                        last_break_time = NULL
                    WHERE id = ?
                `;
                db.query(updateQuery, [existing.id], (err) => {
                    if (err) return callback(err);
                    const logQuery = `INSERT INTO artist_attendance_logs (attendance_id, action, time) VALUES (?, 'Check In', NOW())`;
                    db.query(logQuery, [existing.id]);
                    callback(null, { success: true });
                });
            }
        });
    }

    // Mark check-out / Break for today
    static checkOut(artistId, callback) {
        this.getTodayAttendance(artistId, (err, existing) => {
            if (err) return callback(err);
            if (!existing || !existing.last_check_in) {
                return callback(new Error("Not currently checked in."));
            }

            const updateQuery = `
                UPDATE artist_attendance 
                SET 
                    total_worked_seconds = total_worked_seconds + TIMESTAMPDIFF(SECOND, last_check_in, NOW()),
                    last_check_in = NULL,
                    last_break_time = NOW()
                WHERE id = ?
            `;
            db.query(updateQuery, [existing.id], (err) => {
                if (err) return callback(err);
                const logQuery = `INSERT INTO artist_attendance_logs (attendance_id, action, time) VALUES (?, 'Break/Check Out', NOW())`;
                db.query(logQuery, [existing.id]);
                callback(null, { success: true });
            });
        });
    }

    // Set Leave or Half Day (Artist side)
    static requestLeave(artistId, type, callback) {
        const status = type === 'half' ? 'Half Day' : 'Leave';
        let extraSet = status === 'Leave' ? ', last_check_in = NULL' : '';
        const query = `
            INSERT INTO artist_attendance (artist_id, date, status) 
            VALUES (?, CURDATE(), ?)
            ON DUPLICATE KEY UPDATE status = ?${extraSet}
        `;
        db.query(query, [artistId, status, status], (err) => {
            if (err) return callback(err);
            callback(null, { success: true });
        });
    }

    // Admin: Mark absent or update status manually
    static updateStatus(artistId, date, status, callback) {
        let extraSet = (status === 'Leave' || status === 'Absent') ? ', last_check_in = NULL' : '';
        const query = `
            INSERT INTO artist_attendance (artist_id, date, status) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE status = ?${extraSet}
        `;
        db.query(query, [artistId, date, status, status], (err) => {
            if (err) return callback(err);
            callback(null, { success: true });
        });
    }

    // Get attendance records with filters (Admin)
    static getRecords(filters, callback) {
        let query = `
            SELECT a.*, ar.artist_name 
            FROM artist_attendance a
            JOIN artists ar ON a.artist_id = ar.artist_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.artist_id) {
            query += ` AND a.artist_id = ?`;
            params.push(filters.artist_id);
        }
        if (filters.start_date && filters.end_date) {
            query += ` AND a.date BETWEEN ? AND ?`;
            params.push(filters.start_date, filters.end_date);
        } else if (filters.date) {
            query += ` AND a.date = ?`;
            params.push(filters.date);
        }
        
        query += ` ORDER BY a.date DESC`;

        db.query(query, params, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    }

    // Get Admin Dashboard Overview for a specific date
    static getOverview(date, callback) {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM artists) as total_artists,
                (SELECT COUNT(*) FROM artist_attendance WHERE date = ? AND status = 'Present') as present_count,
                (SELECT COUNT(*) FROM artist_attendance WHERE date = ? AND status IN ('Absent', 'Leave')) as absent_count,
                (SELECT COUNT(*) FROM artist_attendance WHERE date = ? AND status = 'Half Day') as half_day_count
        `;
        db.query(query, [date, date, date, date], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results[0]);
        });
    }
}

module.exports = AttendanceModel;
