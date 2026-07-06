const db = require('../config/db');

// Add Image
// New ✅
exports.addArtImage = (art_id, image_path, imagekit_file_id, callback) => {
    const sql = `
        INSERT INTO art_images (art_id, image_path, imagekit_file_id)
        VALUES (?, ?, ?)
    `;
    db.query(sql, [art_id, image_path, imagekit_file_id], callback);
};

// View Images
exports.getAllArtImages = (callback) => {
    const sql = `
        SELECT art_images.*, arts.title
        FROM art_images
        JOIN arts ON art_images.art_id = arts.art_id
        ORDER BY image_id DESC
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
exports.updateArtImage = (image_id, art_id, image_path, imagekit_file_id, callback) => {
    const sql = `
        UPDATE art_images
        SET art_id = ?, image_path = ?, imagekit_file_id = ?
        WHERE image_id = ?
    `;
    db.query(sql, [art_id, image_path, imagekit_file_id, image_id], callback);
};

// Update Without New Image
exports.updateArtImageWithoutFile = (image_id, art_id, callback) => {
    const sql = `
        UPDATE art_images
        SET art_id = ?
        WHERE image_id = ?
    `;
    db.query(sql, [art_id, image_id], callback);
};

// Delete Image
exports.deleteArtImage = (image_id, callback) => {
    const sql = `
        DELETE FROM art_images
        WHERE image_id = ?
    `;
    db.query(sql, [image_id], callback);
};