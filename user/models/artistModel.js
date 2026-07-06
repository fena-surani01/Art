const db = require('../config/db');

exports.getAllArtistsWithArtCount = (callback) => {
    const sql = `
        SELECT a.*, 
        (SELECT COUNT(*) FROM arts WHERE artist_name = a.artist_name) as arts_count 
        FROM artists a
    `;
    db.query(sql, callback);
};
