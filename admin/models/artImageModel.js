const db = require('../config/db');

// Add Image
exports.addArtImage = (category, art_id, custom_request_id, image_path, imagekit_file_id, callback) => {
    const sql = `
        INSERT INTO art_images (category, art_id, custom_request_id, image_path, imagekit_file_id)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [category || 'Art', art_id || null, custom_request_id || null, image_path, imagekit_file_id], callback);
};

// View Images
exports.getAllArtImages = (callback) => {
    const sql = `
        SELECT 
            ai.*, 
            a.title as art_title,
            u.name as customer_name
        FROM art_images ai
        LEFT JOIN arts a ON ai.art_id = a.art_id
        LEFT JOIN custom_requests cr ON ai.custom_request_id = cr.request_id
        LEFT JOIN user u ON cr.user_id = u.id
        ORDER BY ai.image_id DESC
    `;
    db.query(sql, callback);
};

// Get Single Image
exports.getArtImageById = (image_id, callback) => {
    const sql = `
        SELECT * FROM art_images
        WHERE image_id = ?
    `;
    db.query(sql, [image_id], callback);
};

// Update Image
exports.updateArtImage = (image_id, category, art_id, custom_request_id, image_path, imagekit_file_id, callback) => {
    const sql = `
        UPDATE art_images
        SET category = ?, art_id = ?, custom_request_id = ?, image_path = ?, imagekit_file_id = ?
        WHERE image_id = ?
    `;
    db.query(sql, [category, art_id || null, custom_request_id || null, image_path, imagekit_file_id, image_id], callback);
};

// Update Without New Image
exports.updateArtImageWithoutFile = (image_id, category, art_id, custom_request_id, callback) => {
    const sql = `
        UPDATE art_images
        SET category = ?, art_id = ?, custom_request_id = ?
        WHERE image_id = ?
    `;
    db.query(sql, [category, art_id || null, custom_request_id || null, image_id], callback);
};

// Delete Image
exports.deleteArtImage = (image_id, callback) => {
    const sql = `
        DELETE FROM art_images
        WHERE image_id = ?
    `;
    db.query(sql, [image_id], callback);
};