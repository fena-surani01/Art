const db = require('../config/db')

// Select
exports.getAllArtist = (Callback)=>{
    const sql = `select * from artists`;
    db.query(sql,Callback)
}

// Add
exports.addArtist = (artist_name, gender, description, email, password, salary, join_date, callback) =>{
    const sql = `insert into artists (artist_name, gender, description, email, password_hash, salary, join_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql,[artist_name, gender, description, email, password, salary, join_date],callback)
}

// Delete
exports.deleteArtist = (artist_id, callback) => {
    const sql = `delete from artists where artist_id = ?`;
    db.query(sql,[artist_id],callback)
}

// Edit Fetch
exports.getArtistById = (artist_id, callback)=>{
    const sql = `select * from artists where artist_id = ?`;
    db.query(sql,[artist_id],callback)

}

// Edit
exports.updateArtist = (artist_id, artist_name, gender, email, password, salary, join_date, callback) => {
    let sql = `
        UPDATE artists 
        SET artist_name = ?, gender = ?, email = ?, salary = ?, join_date = ?
    `;
    const params = [artist_name, gender, email, salary, join_date];

    if (password && password.trim() !== '') {
        sql += `, password_hash = ? `;
        params.push(password);
    }

    sql += ` WHERE artist_id = ?`;
    params.push(artist_id);

    db.query(sql, params, callback);
};



