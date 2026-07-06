const db = require('../config/db');

const addCustomRequest = (data, callback) => {
    const query = `
        INSERT INTO custom_requests (
            user_id, reference_image, description, size, format, qty, 
            estimated_price, imagekit_file_id,
            shipping_address, shipping_city, shipping_state, shipping_zip, 
            phone_number, payment_method, payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.user_id,
        data.reference_image || null,
        data.description,
        data.size,
        data.format,
        data.qty,
        data.estimated_price,
        data.imagekit_file_id || null,
        data.shipping_address || null,
        data.shipping_city || null,
        data.shipping_state || null,
        data.shipping_zip || null,
        data.phone_number || null,
        data.payment_method || 'COD',
        data.payment_status || 'Pending'
    ];
    db.query(query, params, callback);
};

const getCustomRequestsByUserId = (userId, callback) => {
    const query = `
        SELECT * FROM custom_requests
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;
    db.query(query, [userId], callback);
};

module.exports = {
    addCustomRequest,
    getCustomRequestsByUserId
};
