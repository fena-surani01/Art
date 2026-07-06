const notificationModel = require('../models/notificationModel');

exports.getNotifications = (req, res) => {
    if (!req.session.admin) return res.status(401).json({ success: false });

    // If admin, user_id is 0, role is 'admin'
    // If artist, user_id is admin.id, role is 'artist'
    const userId = req.session.admin.role === 'artist' ? req.session.admin.id : 0;
    const role = req.session.admin.role === 'artist' ? 'artist' : 'admin';

    notificationModel.getUnreadNotifications(userId, role, (err, notifications) => {
        if (err) {
            console.error("Error fetching notifications:", err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, notifications });
    });
};

exports.markAsRead = (req, res) => {
    if (!req.session.admin) return res.status(401).json({ success: false });

    const userId = req.session.admin.role === 'artist' ? req.session.admin.id : 0;
    const { id } = req.params;

    notificationModel.markAsRead(id, userId, (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
};

exports.markAllAsRead = (req, res) => {
    if (!req.session.admin) return res.status(401).json({ success: false });

    const userId = req.session.admin.role === 'artist' ? req.session.admin.id : 0;
    const role = req.session.admin.role === 'artist' ? 'artist' : 'admin';

    notificationModel.markAllAsRead(userId, role, (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
};
