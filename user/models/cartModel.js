const db = require('../config/db');

const addToCart = (userId, artId, callback) => {
    const checkSql = `SELECT * FROM cart WHERE user_id = ? AND art_id = ?`;
    db.query(checkSql, [userId, artId], (err, results) => {
        if (err) return callback(err);

        if (results.length > 0) {
            const updateSql = `UPDATE cart SET quantity = quantity + 1 WHERE cart_id = ?`;
            db.query(updateSql, [results[0].cart_id], callback);
        } else {
            const insertSql = `INSERT INTO cart (user_id, art_id, quantity) VALUES (?, ?, 1)`;
            db.query(insertSql, [userId, artId], callback);
        }
    });
};

const getCartByUserId = (userId, callback) => {
    const sql = `
        SELECT 
            c.cart_id, c.quantity, c.created_at,
            a.art_id, a.title, a.price, a.category, a.artist_name, a.stock, a.art_size, a.art_type,
            MIN(ai.image_path) as image_path
        FROM cart c
        JOIN arts a ON c.art_id = a.art_id
        LEFT JOIN art_images ai ON a.art_id = ai.art_id
        WHERE c.user_id = ?
        GROUP BY c.cart_id
        ORDER BY c.created_at DESC;
    `;
    db.query(sql, [userId], callback);
};

const removeFromCart = (cartId, userId, callback) => {
    const sql = `DELETE FROM cart WHERE cart_id = ? AND user_id = ?`;
    db.query(sql, [cartId, userId], callback);
};

const updateCartQuantity = (cartId, userId, newQuantity, callback) => {
    const sql = `UPDATE cart SET quantity = ? WHERE cart_id = ? AND user_id = ?`;
    db.query(sql, [newQuantity, cartId, userId], callback);
};

const getCartCount = (userId, callback) => {
    const sql = `SELECT SUM(quantity) as total_count FROM cart WHERE user_id = ?`;
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0].total_count || 0);
    });
};

const getCartItemIds = (userId, callback) => {
    const sql = `SELECT art_id FROM cart WHERE user_id = ?`;
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        const ids = results.map(r => r.art_id);
        callback(null, ids);
    });
};

module.exports = {
    addToCart,
    getCartByUserId,
    removeFromCart,
    updateCartQuantity,
    getCartCount,
    getCartItemIds
};
