const db = require('../config/db');

const orderModel = {
    getAllOrders: (callback) => {
        const query = `
            SELECT o.*, u.name as customer_name, u.email as customer_email 
            FROM orders o
            JOIN user u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `;
        db.query(query, (err, results) => {
            callback(err, results);
        });
    },

    getOrderItems: (orderId, callback) => {
        const query = `
            SELECT oi.*, a.title, a.art_type, a.art_size, a.artist_name, MIN(ai.image_path) as image_path
            FROM order_items oi
            JOIN arts a ON oi.art_id = a.art_id
            LEFT JOIN art_images ai ON a.art_id = ai.art_id
            WHERE oi.order_id = ?
            GROUP BY oi.order_item_id
        `;
        db.query(query, [orderId], (err, results) => {
            callback(err, results);
        });
    },
    
    updateOrderStatus: (orderId, status, callback) => {
        let query;
        if (status === 'Delivered') {
            query = "UPDATE orders SET status = ?, delivered_at = NOW() WHERE order_id = ?";
        } else {
            query = "UPDATE orders SET status = ? WHERE order_id = ?";
        }
        db.query(query, [status, orderId], (err, result) => {
            callback(err, result);
        });
    },

    checkNewOrders: (lastOrderId, callback) => {
        let orderQuery;
        let params = [];
        if (!lastOrderId || lastOrderId == 'null') {
            orderQuery = "SELECT MAX(order_id) as max_id FROM orders";
        } else {
            orderQuery = "SELECT COUNT(order_id) as new_count, MAX(order_id) as max_id FROM orders WHERE order_id > ?";
            params = [lastOrderId];
        }

        db.query(orderQuery, params, (err, orderResults) => {
            if (err) return callback(err);

            const cancelledQuery = "SELECT COUNT(order_id) as cancelled_count FROM orders WHERE status = 'Cancelled'";
            db.query(cancelledQuery, (err, cancelledResults) => {
                if (err) return callback(err);

                const outOfStockQuery = "SELECT COUNT(art_id) as out_of_stock_count FROM arts WHERE stock <= 0";
                db.query(outOfStockQuery, (err, stockResults) => {
                    if (err) return callback(err);

                    callback(null, {
                        orders: orderResults[0],
                        cancelled_count: cancelledResults[0].cancelled_count,
                        out_of_stock_count: stockResults[0].out_of_stock_count
                    });
                });
            });
        });
    }
};

module.exports = orderModel;
