const db = require('../config/db');

const reviewController = {
    checkPendingReviews: (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.json({ success: false, items: [] });
        }

        const userId = req.session.user.id;

        // Find delivered standard orders that haven't been reviewed yet by this user
        const orderQuery = `
            SELECT oi.art_id, oi.order_id, a.title, MIN(ai.image_path) as image_path, o.delivered_at
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN arts a ON oi.art_id = a.art_id
            LEFT JOIN art_images ai ON a.art_id = ai.art_id
            LEFT JOIN reviews r ON r.order_id = o.order_id AND r.art_id = oi.art_id AND r.user_id = ?
            WHERE o.user_id = ?
              AND o.status = 'Delivered'
              AND r.review_id IS NULL
            GROUP BY oi.art_id, oi.order_id, a.title, o.delivered_at
            ORDER BY o.delivered_at ASC
        `;

        // Find delivered Custom Art requests that haven't been reviewed yet by this user
        const customQuery = `
            SELECT cr.request_id as custom_request_id, 
                   CONCAT('Custom Art #REQ-', cr.request_id) as title, 
                   COALESCE((SELECT MIN(image_path) FROM art_images WHERE custom_request_id = cr.request_id), cr.reference_image) as image_path, 
                   cr.created_at
            FROM custom_requests cr
            WHERE cr.user_id = ?
              AND cr.status = 'Delivered'
              AND cr.customer_review IS NULL
            ORDER BY cr.created_at ASC
        `;

        db.query(orderQuery, [userId, userId], (err, orderItems) => {
            if (err) {
                console.error("Error fetching pending order reviews:", err);
                orderItems = [];
            }

            db.query(customQuery, [userId], (err2, customItems) => {
                if (err2) {
                    console.error("Error fetching pending custom art reviews:", err2);
                    customItems = [];
                }

                const allItems = [...(orderItems || []), ...(customItems || [])];
                res.json({ success: true, items: allItems });
            });
        });
    },

    submitReview: (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.json({ success: false, message: 'Not logged in' });
        }

        const userId = req.session.user.id;
        const { order_id, art_id, custom_request_id, rating, comment } = req.body;

        if (!rating) {
            return res.json({ success: false, message: 'Please select a star rating' });
        }

        if (custom_request_id) {
            // Update custom_requests rating & customer_review
            const query = "UPDATE custom_requests SET rating = ?, customer_review = ? WHERE request_id = ? AND user_id = ?";
            db.query(query, [rating, comment || '', custom_request_id, userId], (err, result) => {
                if (err) {
                    console.error("Error submitting custom art review:", err);
                    return res.json({ success: false, message: 'Database error' });
                }
                res.json({ success: true, message: 'Review submitted successfully' });
            });
        } else {
            if (!order_id || !art_id) {
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
        }
    },

    getApprovedReviews: (req, res) => {
        const query = `
            SELECT r.review_id, r.rating, r.comment, r.created_at, r.art_id,
                   u.name as customer_name, a.title as art_title, MIN(ai.image_path) as art_image
            FROM reviews r
            JOIN user u ON r.user_id = u.id
            JOIN arts a ON r.art_id = a.art_id
            LEFT JOIN art_images ai ON a.art_id = ai.art_id
            WHERE r.is_approved = 1 AND r.comment IS NOT NULL AND r.comment != ''
            GROUP BY r.review_id
            ORDER BY r.created_at DESC
        `;
        db.query(query, (err, results) => {
            if (err) {
                console.error("Error fetching approved reviews:", err);
                return res.json({ success: false, reviews: [] });
            }

            // Group reviews by art_id so each art piece has 1 card
            const artGroupMap = {};
            results.forEach(row => {
                if (!artGroupMap[row.art_id]) {
                    artGroupMap[row.art_id] = {
                        art_id: row.art_id,
                        art_title: row.art_title,
                        art_image: row.art_image,
                        total_rating: 0,
                        review_count: 0,
                        comments: []
                    };
                }
                artGroupMap[row.art_id].total_rating += Number(row.rating);
                artGroupMap[row.art_id].review_count += 1;
                artGroupMap[row.art_id].comments.push({
                    customer_name: row.customer_name,
                    rating: Number(row.rating),
                    comment: row.comment,
                    created_at: row.created_at
                });
            });

            const groupedReviews = Object.values(artGroupMap).map(art => {
                art.avg_rating = (art.total_rating / art.review_count).toFixed(1);
                return art;
            });

            res.json({ success: true, reviews: groupedReviews });
        });
    }
};

module.exports = reviewController;
