const db = require('../config/db');

const addReturnRequest = (orderId, userId, reason, otherReason, callback) => {
    // Generate estimated pickup date (today + 3 days)
    const estPickup = new Date();
    estPickup.setDate(estPickup.getDate() + 3);
    
    const query = `
        INSERT INTO returns (order_id, user_id, reason, other_reason, estimated_pickup)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(query, [orderId, userId, reason, otherReason, estPickup], (err, result) => {
        if (err) return callback(err, null);
        
        // Also update the order status to 'Return Requested'
        const updateQuery = "UPDATE orders SET status = 'Return Requested' WHERE order_id = ?";
        db.query(updateQuery, [orderId], (err2) => {
            callback(err2, { ...result, estimated_pickup: estPickup });
        });
    });
};

const getReturnsByUserId = (userId, callback) => {
    const query = 'SELECT * FROM returns WHERE user_id = ? ORDER BY created_at DESC';
    db.query(query, [userId], callback);
};

const getAllReturns = (callback) => {
    const query = 'SELECT r.*, u.username, u.email FROM returns r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC';
    db.query(query, callback);
};

module.exports = {
    addReturnRequest,
    getReturnsByUserId,
    getAllReturns
};
