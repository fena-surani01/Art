const db = require('../config/db');

exports.signUp = (name,email,password,callback)=> {
    const sql = "insert into user (name,email,password) values(?,?,?)";

    db.query(sql,[name,email,password],callback);
}

exports.checkemail = (email,callback) => {
    const sql = "select * from user where email=? ";
    db.query(sql,[email],callback)
}

exports.checklogin = (email,callback) => {
    const sql = "select * from user where email = ? ";
    db.query(sql,[email],callback)
}

exports.setOnlineStatus = (userId, status, callback) => {
    const sql = "update user set is_online = ? where id = ?";
    db.query(sql, [status, userId], callback);
}