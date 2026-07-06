const db = require('../config/db')

const getAllArts = (callback) =>{
    const sql = `SELECT
                a.*,
                ai.image_path,
                (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE art_id = a.art_id AND is_approved = 1) as calculated_rating,
                (SELECT COUNT(review_id) FROM reviews WHERE art_id = a.art_id AND is_approved = 1) as review_count
            FROM arts a
            LEFT JOIN art_images ai
            ON a.art_id = ai.art_id
            ORDER BY a.art_id;`;

    db.query(sql,callback)
}

const getArtByIdWithImages = (id, callback) => {
    const sql = `SELECT
                a.*,
                ai.image_path,
                (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE art_id = a.art_id AND is_approved = 1) as calculated_rating,
                (SELECT COUNT(review_id) FROM reviews WHERE art_id = a.art_id AND is_approved = 1) as review_count
            FROM arts a
            LEFT JOIN art_images ai
            ON a.art_id = ai.art_id
            WHERE a.art_id = ?
            ORDER BY ai.image_id ASC;`;

    db.query(sql, [id], callback);
}

module.exports = {
    getAllArts,
    getArtByIdWithImages
}