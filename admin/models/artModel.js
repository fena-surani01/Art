const db = require('../config/db');

// Select all arts
exports.getAllArts = (callback) => {
    const sql = `SELECT * FROM arts ORDER BY art_id DESC`;
    db.query(sql, callback);
};

// Add art
exports.addArt = (title, description, category, art_type, artist_name, price, art_size, stock, callback) => {
    const sql = `
        INSERT INTO arts 
        (title, description, category, art_type, artist_name, price, art_size, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [title, description, category, art_type, artist_name, price, art_size, stock], callback);
};

// Delete art
exports.deleteArt = (art_id, callback) => {
    const sql = `DELETE FROM arts WHERE art_id = ?`;
    db.query(sql, [art_id], callback);
};

// Get single art
exports.getArtById = (art_id, callback) => {
    const sql = `SELECT * FROM arts WHERE art_id = ?`;
    db.query(sql, [art_id], callback);
};

// Update art
exports.updateArt = (art_id, title, description, category, art_type, artist_name, price, art_size, stock, callback) => {
    const sql = `
        UPDATE arts
        SET title = ?, description = ?, category = ?, art_type = ?, artist_name = ?, price = ?, art_size = ?, stock = ?
        WHERE art_id = ?
    `;

    db.query(sql, [title, description, category, art_type, artist_name, price, art_size, stock, art_id], callback);
};