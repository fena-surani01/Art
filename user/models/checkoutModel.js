const db = require('../config/db');

const checkoutModel = {
    // 1. Create the main order record
    createOrder: (userId, finalTotal, details, callback) => {
        const query = `
            INSERT INTO orders 
            (user_id, total_amount, status, shipping_address, shipping_city, shipping_state, shipping_zip, phone_number, payment_method, payment_status) 
            VALUES (?, ?, 'Pending', ?, ?, ?, ?, ?, ?, 'Pending')
        `;
        const values = [
            userId,
            finalTotal,
            details.address,
            details.city,
            details.state,
            details.zip_code,
            details.phone_number,
            details.payment_method || 'COD'
        ];

        db.query(query, values, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result.insertId); // Return the new order ID
        });
    },

    // 2. Insert items from cart into order_items
    addOrderItems: (orderId, cartItems, callback) => {
        if (!cartItems || cartItems.length === 0) {
            return callback(null, true);
        }

        const query = `
            INSERT INTO order_items (order_id, art_id, quantity, price) 
            VALUES ?
        `;
        
        // Prepare bulk insert array
        const values = cartItems.map(item => [
            orderId,
            item.art_id,
            item.quantity,
            item.price
        ]);

        db.query(query, [values], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result);
        });
    },

    // 3. Update the user's default details (if they entered new ones)
    updateUserDetails: (userId, details, callback) => {
        const query = `
            UPDATE user 
            SET phone_number = ?, address = ?, city = ?, state = ?, zip_code = ?
            WHERE id = ?
        `;
        const values = [
            details.phone_number,
            details.address,
            details.city,
            details.state,
            details.zip_code,
            userId
        ];
        db.query(query, values, (err, result) => {
            callback(err, result);
        });
    },

    // 4. Clear the user's cart
    clearCart: (userId, callback) => {
        const query = "DELETE FROM cart WHERE user_id = ?";
        db.query(query, [userId], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result);
        });
    },

    // 5. Deduct stock for ordered items
    deductStock: (cartItems, callback) => {
        if (!cartItems || cartItems.length === 0) {
            return callback(null, true);
        }

        let completed = 0;
        let hasError = false;

        cartItems.forEach(item => {
            const query = "UPDATE arts SET stock = stock - ? WHERE art_id = ?";
            db.query(query, [item.quantity, item.art_id], (err, result) => {
                if (err) hasError = true;
                completed++;
                if (completed === cartItems.length) {
                    callback(hasError ? new Error("Stock deduction failed for some items") : null, true);
                }
            });
        });
    }
};

module.exports = checkoutModel;
