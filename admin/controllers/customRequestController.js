const db = require('../config/db');
const notificationModel = require('../models/notificationModel');

const viewCustomRequestsPage = (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/signin');
    }

    let query = `
        SELECT cr.*, u.name as customer_name, u.email as customer_email, a.artist_name 
        FROM custom_requests cr
        JOIN user u ON cr.user_id = u.id
        LEFT JOIN artists a ON cr.assigned_artist_id = a.artist_id
    `;

    const queryParams = [];

    if (req.session.admin.role === 'artist') {
        query += ` WHERE cr.assigned_artist_id = ? `;
        queryParams.push(req.session.admin.id);
    }

    query += ` ORDER BY cr.created_at DESC `;

    db.query(query, queryParams, (err, requests) => {
        if (err) {
            console.error("Error fetching custom requests:", err);
            return res.status(500).send("Error loading custom requests");
        }
        
        db.query("SELECT * FROM artists WHERE status = 'Active'", (err, artists) => {
            if (err) {
                console.error("Error fetching artists:", err);
                return res.status(500).send("Error loading artists");
            }
            res.render('customRequests', {
                admin: req.session.admin,
                requests: requests,
                artists: artists,
                title: 'Custom Requests',
                path: '/admin/custom-requests/view'
            });
        });
    });
};

const updateCustomRequestStatus = (req, res) => {
    if (!req.session.admin) return res.status(401).json({ success: false });

    const { id } = req.params;
    const { status } = req.body;

    const query = `UPDATE custom_requests SET status = ? WHERE request_id = ?`;
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error("Error updating custom request status:", err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Status updated successfully' });
    });
};

const updateArtistStatus = (req, res) => {
    if (!req.session.admin) return res.status(401).json({ success: false });

    const { id } = req.params;
    const { artist_status } = req.body;

    const query = `UPDATE custom_requests SET artist_status = ? WHERE request_id = ? AND assigned_artist_id = ?`;
    db.query(query, [artist_status, id, req.session.admin.id], (err, result) => {
        if (err) {
            console.error("Error updating artist status:", err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        notificationModel.createNotification(0, 'admin', 'Artist Status Updated', `Artist updated the status of Request #REQ-${id} to ${artist_status}.`, () => {});
        res.json({ success: true, message: 'Artist status updated successfully' });
    });
};

const assignCustomRequest = (req, res) => {
    if (!req.session.admin) return res.status(401).json({ success: false });

    const { id } = req.params;
    const { artist_id } = req.body;

    const query = `UPDATE custom_requests SET assigned_artist_id = ?, artist_status = 'Assigned' WHERE request_id = ?`;
    db.query(query, [artist_id || null, id], (err, result) => {
        if (err) {
            console.error("Error assigning artist:", err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (artist_id) {
            notificationModel.createNotification(artist_id, 'artist', 'New Assignment', `You have been assigned to custom artwork request #REQ-${id}.`, () => {});
        }
        res.json({ success: true, message: 'Artist assigned successfully' });
    });
};

const checkNewRequests = (req, res) => {
    let lastId = req.query.lastRequestId;

    const maxIdQuery = "SELECT MAX(request_id) as max_id FROM custom_requests";
    db.query(maxIdQuery, (err, result1) => {
        if (err) {
            return res.status(500).json({ success: false });
        }

        const max_id = result1[0].max_id;

        if (lastId === 'null' || !lastId) {
            return res.json({ success: true, requests: { max_id: max_id, new_count: 0 } });
        }

        const newReqsQuery = "SELECT COUNT(*) as count FROM custom_requests WHERE request_id > ?";
        db.query(newReqsQuery, [lastId], (err, result2) => {
            if (err) {
                return res.status(500).json({ success: false });
            }

            const new_count = result2[0].count;
            res.json({ success: true, requests: { max_id: max_id, new_count: new_count } });
        });
    });
};

module.exports = {
    viewCustomRequestsPage,
    updateCustomRequestStatus,
    updateArtistStatus,
    checkNewRequests,
    assignCustomRequest
};
