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

const trackCustomRequest = (requestId, callback) => {
    const query = 'SELECT * FROM custom_requests WHERE request_id = ?';
    db.query(query, [requestId], (err, results) => {
        if (err) return callback(err, null);
        callback(null, results.length > 0 ? results[0] : null);
    });
};

const getHappyCustomers = (callback) => {
    const query = `
        SELECT cr.*, u.name as customer_name, a.artist_name 
        FROM custom_requests cr
        LEFT JOIN user u ON cr.user_id = u.id
        LEFT JOIN artists a ON cr.assigned_artist_id = a.artist_id
        WHERE cr.show_in_gallery = 1
        ORDER BY cr.created_at DESC
    `;
    db.query(query, [], (err, results) => {
        if (err) {
            console.error("Error fetching happy customers:", err);
            return callback(null, []);
        }

        if (!results || results.length === 0) {
            return callback(null, []);
        }

        const imgQuery = `
            SELECT custom_request_id, image_path 
            FROM art_images 
            WHERE custom_request_id IS NOT NULL
        `;
        db.query(imgQuery, [], (imgErr, imgResults) => {
            const imgMap = {};
            if (!imgErr && imgResults) {
                imgResults.forEach(img => {
                    if (!imgMap[img.custom_request_id]) {
                        imgMap[img.custom_request_id] = [];
                    }
                    imgMap[img.custom_request_id].push(img.image_path);
                });
            }

            results.forEach(req => {
                const adminImgs = imgMap[req.request_id] || [];
                req.gallery_images = adminImgs; // ONLY Admin added images
            });

            callback(null, results);
        });
    });
};

module.exports = {
    addCustomRequest,
    getCustomRequestsByUserId,
    trackCustomRequest,
    getHappyCustomers
};
