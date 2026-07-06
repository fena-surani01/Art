const db = require('../config/db');

const reviewController = {
    viewReviewsPage: (req, res) => {
        const query = `
            SELECT r.*, a.title as art_title, MIN(ai.image_path) as art_image, u.name as customer_name, o.order_id 
            FROM reviews r
            JOIN arts a ON r.art_id = a.art_id
            LEFT JOIN art_images ai ON a.art_id = ai.art_id
            JOIN user u ON r.user_id = u.id
            JOIN orders o ON r.order_id = o.order_id
            GROUP BY r.review_id
            ORDER BY r.created_at DESC
        `;
        db.query(query, (err, reviews) => {
            if (err) {
                console.error("Error fetching reviews:", err);
                return res.status(500).send("Error loading reviews");
            }
            res.render('reviews', { reviews });
        });
    },
    
    checkNewReviewsAPI: (req, res) => {
        const lastReviewId = req.query.lastReviewId;
        let query;
        let params = [];
        
        if (!lastReviewId || lastReviewId == 'null') {
            query = "SELECT MAX(review_id) as max_id FROM reviews";
        } else {
            query = "SELECT COUNT(review_id) as new_count, MAX(review_id) as max_id FROM reviews WHERE review_id > ?";
            params = [lastReviewId];
        }

        db.query(query, params, (err, results) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, new_count: 0, max_id: null });
            }
            res.json({ success: true, reviews: results[0] });
        });
    },

    approveReviewAPI: (req, res) => {
        const { id } = req.params;
        const { is_approved } = req.body;
        
        const query = "UPDATE reviews SET is_approved = ? WHERE review_id = ?";
        db.query(query, [is_approved ? 1 : 0, id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Failed to update review status' });
            }
            res.json({ success: true, message: 'Review status updated' });
        });
    }
};

module.exports = reviewController;
