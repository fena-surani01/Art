const db = require('../config/db');

exports.checkAdmin = (email,password,callback)=>{
    const sql = "select * from admin where email = ?  and password = ?";
    db.query(sql,[email,password],callback);
}

exports.checkArtist = (email,password,callback)=>{
    const sql = "select * from artists where email = ?  and password_hash = ?";
    db.query(sql,[email,password],callback);
}

exports.getDashboardStats = (filter, adminUser, callback) => {
    let dateCondition = '';
    
    if (!filter || filter === 'today') {
        dateCondition = 'DATE(created_at) = CURDATE()';
    } else if (filter === 'week') {
        dateCondition = 'created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (filter === 'month') {
        dateCondition = 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
    } else if (filter === 'all') {
        dateCondition = '1=1';
    } else {
        dateCondition = 'DATE(created_at) = CURDATE()';
    }

    let queries = {};

    if (adminUser.role === 'artist') {
        queries = {
            customRequests: `
                SELECT 
                    COUNT(*) as total_assigned,
                    SUM(CASE WHEN artist_status = 'Pending' OR artist_status = 'Assigned' THEN 1 ELSE 0 END) as pending_requests,
                    SUM(CASE WHEN artist_status = 'In Progress' THEN 1 ELSE 0 END) as working_requests,
                    SUM(CASE WHEN artist_status = 'Completed' THEN 1 ELSE 0 END) as completed_requests
                FROM custom_requests 
                WHERE assigned_artist_id = ${db.escape(adminUser.id)} AND ${dateCondition}
            `,
            reviews: `
                SELECT COUNT(r.review_id) as count 
                FROM reviews r
                JOIN arts a ON r.art_id = a.art_id
                WHERE a.artist_name = ${db.escape(adminUser.name)} 
                AND ${dateCondition === '1=1' ? '1=1' : dateCondition.replace(/created_at/g, 'r.created_at')}
            `
        };
    } else {
        queries = {
            totalArts: `SELECT COUNT(*) as count FROM arts`,
            orders: `
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_orders,
                    SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as delivered_orders
                FROM orders 
                WHERE ${dateCondition}
            `,
            reviews: `
                SELECT COUNT(*) as count FROM reviews WHERE ${dateCondition}
            `,
            customRequests: `
                SELECT 
                    COUNT(*) as total_requests,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_requests,
                    SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_requests
                FROM custom_requests 
                WHERE ${dateCondition}
            `,
            artistLive: `
                SELECT 
                    (SELECT COUNT(*) FROM artists) as total,
                    (SELECT COUNT(*) FROM artists WHERE is_online = TRUE) as online,
                    (SELECT COUNT(*) FROM artist_attendance WHERE date = CURDATE() AND status = 'Present' AND last_break_time IS NULL) as present,
                    (SELECT COUNT(*) FROM artist_attendance WHERE date = CURDATE() AND last_break_time IS NOT NULL) as on_break,
                    (SELECT COUNT(*) FROM artist_attendance WHERE date = CURDATE() AND status IN ('Leave', 'Absent')) as full_leave,
                    (SELECT COUNT(*) FROM artist_attendance WHERE date = CURDATE() AND status = 'Half Day') as half_leave
            `,
            userLive: `
                SELECT 
                    (SELECT COUNT(*) FROM user) as total,
                    (SELECT COUNT(*) FROM user WHERE is_online = TRUE) as online
            `
        };
    }

    let results = {};
    let queriesCompleted = 0;
    const totalQueries = Object.keys(queries).length;
    let hasError = false;

    for (let key in queries) {
        db.query(queries[key], (err, row) => {
            if (hasError) return;
            if (err) {
                hasError = true;
                return callback(err);
            }
            results[key] = row[0];
            queriesCompleted++;

            if (queriesCompleted === totalQueries) {
                if (results.orders) {
                    if (results.orders.pending_orders === null) results.orders.pending_orders = 0;
                    if (results.orders.delivered_orders === null) results.orders.delivered_orders = 0;
                }
                if (results.customRequests) {
                    if (results.customRequests.pending_requests === null) results.customRequests.pending_requests = 0;
                    if (results.customRequests.working_requests === null) results.customRequests.working_requests = 0;
                    if (results.customRequests.completed_requests === null) results.customRequests.completed_requests = 0;
                }
                callback(null, results);
            }
        });
    }
};

exports.updateAdmin = (id, name, email, password, callback) => {
    let sql = 'UPDATE admin SET name = ?, email = ?';
    let params = [name, email];
    if (password && password.trim() !== '') {
        sql += ', password = ?';
        params.push(password);
    }
    sql += ' WHERE id = ?';
    params.push(id);
    db.query(sql, params, callback);
};

exports.updateArtistOnlineStatus = (artistId, isOnline, callback) => {
    const sql = 'UPDATE artists SET is_online = ? WHERE artist_id = ?';
    db.query(sql, [isOnline, artistId], (err, result) => {
        if (callback) callback(err, result);
    });
};

