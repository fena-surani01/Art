const db = require('../config/db');

const orderModel = {
    getUserOrders: (userId, callback) => {
        const query = `
            SELECT o.*, MAX(r.estimated_pickup) as estimated_pickup
            FROM orders o
            LEFT JOIN returns r ON o.order_id = r.order_id
            WHERE o.user_id = ?
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
        `;
        db.query(query, [userId], (err, orders) => {
            if (err) return callback(err, null);
            
            if (orders.length === 0) {
                return callback(null, []);
            }

            // Fetch order items for these orders
            const orderIds = orders.map(o => o.order_id);
            const itemsQuery = `
                SELECT oi.*, a.title, a.art_type, a.art_size, a.artist_name, MIN(ai.image_path) as image_path,
                       r.rating as review_rating, r.comment as review_comment, r.created_at as review_date
                FROM order_items oi
                JOIN arts a ON oi.art_id = a.art_id
                LEFT JOIN art_images ai ON a.art_id = ai.art_id
                LEFT JOIN reviews r ON oi.order_id = r.order_id AND oi.art_id = r.art_id
                WHERE oi.order_id IN (?)
                GROUP BY oi.order_item_id, a.title, a.art_type, a.art_size, a.artist_name, r.rating, r.comment, r.created_at
            `;
            
            db.query(itemsQuery, [orderIds], (err, items) => {
                if (err) return callback(err, null);
                
                // Map items to their respective orders
                orders.forEach(order => {
                    order.items = items.filter(item => item.order_id === order.order_id);
                });
                
                callback(null, orders);
            });
        });
    },

    cancelOrder: (orderId, userId, callback) => {
        const query = "UPDATE orders SET status = 'Cancelled' WHERE order_id = ? AND user_id = ? AND status IN ('Pending', 'Processing')";
        db.query(query, [orderId, userId], (err, result) => {
            callback(err, result);
        });
    },

    trackOrder: (orderId, callback) => {
        const query = `
            SELECT o.order_id, o.status, o.created_at, o.total_amount, MAX(r.estimated_pickup) as estimated_pickup
            FROM orders o
            LEFT JOIN returns r ON o.order_id = r.order_id
            WHERE o.order_id = ?
            GROUP BY o.order_id
        `;
        db.query(query, [orderId], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    }
};

module.exports = orderModel;
