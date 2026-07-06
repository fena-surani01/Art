const db = require('../config/db');

const reviewController = {
    checkPendingReviews: (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.json({ success: false, items: [] });
        }

        const userId = req.session.user.id;

        // Find delivered orders that are older than 2 minutes,
        // and find the items in them that haven't been reviewed yet by this user.
        const query = `
            SELECT oi.art_id, oi.order_id, a.title, MIN(ai.image_path) as image_path, o.delivered_at
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN arts a ON oi.art_id = a.art_id
            LEFT JOIN art_images ai ON a.art_id = ai.art_id
            LEFT JOIN reviews r ON r.order_id = o.order_id AND r.art_id = oi.art_id AND r.user_id = ?
            WHERE o.user_id = ?
              AND o.status = 'Delivered'
              AND o.delivered_at IS NOT NULL
              AND o.delivered_at <= DATE_SUB(NOW(), INTERVAL 2 MINUTE)
              AND r.review_id IS NULL
            GROUP BY oi.art_id, oi.order_id, a.title, o.delivered_at
            ORDER BY o.delivered_at ASC
        `;

        db.query(query, [userId, userId], (err, results) => {
            if (err) {
                console.error("Error fetching pending reviews:", err);
                return res.json({ success: false, items: [] });
            }

            res.json({ success: true, items: results });
        });
    },

    submitReview: (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.json({ success: false, message: 'Not logged in' });
        }

        const userId = req.session.user.id;
        const { order_id, art_id, rating, comment } = req.body;

        if (!order_id || !art_id || !rating) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const query = "INSERT INTO reviews (order_id, art_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)";
        db.query(query, [order_id, art_id, userId, rating, comment || ''], (err, result) => {
            if (err) {
                console.error("Error submitting review:", err);
                return res.json({ success: false, message: 'Database error' });
            }

            // Trigger notification to artist
            db.query("SELECT a.artist_name, ar.artist_id FROM arts a LEFT JOIN artists ar ON a.artist_name = ar.artist_name WHERE a.art_id = ?", [art_id], (err2, artistRes) => {
                if (!err2 && artistRes && artistRes.length > 0 && artistRes[0].artist_id) {
                    const notificationModel = require('../../admin/models/notificationModel');
                    notificationModel.createNotification(artistRes[0].artist_id, 'artist', 'Congratulations!', `A customer left a ${rating}-star review on your artwork!`, () => {});
                }
            });

            res.json({ success: true, message: 'Review submitted successfully' });
        });
    },

    getApprovedReviews: (req, res) => {
        const query = `
            SELECT r.rating, r.comment, u.name as customer_name, a.title as art_title, MIN(ai.image_path) as art_image
            FROM reviews r
            JOIN user u ON r.user_id = u.id
            JOIN arts a ON r.art_id = a.art_id
            LEFT JOIN art_images ai ON a.art_id = ai.art_id
            WHERE r.is_approved = 1 AND r.comment IS NOT NULL AND r.comment != ''
            GROUP BY r.review_id
            ORDER BY r.created_at DESC
            LIMIT 10
        `;
        db.query(query, (err, results) => {
            if (err) {
                console.error("Error fetching approved reviews:", err);
                return res.json({ success: false, reviews: [] });
            }
            res.json({ success: true, reviews: results });
        });
    }
};

module.exports = reviewController;
