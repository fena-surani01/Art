const db = require('../config/db');

exports.createNotification = (userId, role, title, message, callback) => {
    const sql = "INSERT INTO notifications (user_id, role, title, message) VALUES (?, ?, ?, ?)";
    db.query(sql, [userId, role, title, message], callback);
};

exports.getUnreadNotifications = (userId, role, callback) => {
    const sql = "SELECT * FROM notifications WHERE user_id = ? AND role = ? AND is_read = FALSE ORDER BY created_at DESC";
    db.query(sql, [userId, role], callback);
};

exports.markAsRead = (id, userId, callback) => {
    const sql = "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?";
    db.query(sql, [id, userId], callback);
};

exports.markAllAsRead = (userId, role, callback) => {
    const sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND role = ?";
    db.query(sql, [userId, role], callback);
};
