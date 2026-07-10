const db = require('../config/db');

exports.viewReturnsPage = (req, res) => {
    const query = 'SELECT r.*, u.name as customer_name, o.phone_number, u.email as customer_email, o.total_amount FROM returns r JOIN user u ON r.user_id = u.id JOIN orders o ON r.order_id = o.order_id ORDER BY r.created_at DESC';
    db.query(query, (err, returns) => {
        if (err) {
            console.error(err);
            return res.render('returns', { returns: [] });
        }
        res.render('returns', { returns });
    });
};

exports.updateReturnStatusAPI = (req, res) => {
    const returnId = req.params.id;
    const { status } = req.body;
    
    db.query('UPDATE returns SET status = ? WHERE return_id = ?', [status, returnId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        
        // If approved, you might want to do further logic here (e.g. updating the original order to 'Refunded' or something)
        // But for now we just update the returns table status.
        res.json({ success: true, message: 'Status updated successfully' });
    });
};

exports.checkNewReturnsAPI = (req, res) => {
    let lastReturnId = req.query.lastReturnId;
    
    // First run initialization check
    if (lastReturnId === 'null' || !lastReturnId) {
        db.query('SELECT MAX(return_id) as max_id FROM returns', (err, result) => {
            if (err) return res.status(500).json({ success: false });
            return res.json({ 
                success: true, 
                returns: { max_id: result[0].max_id || 0, new_count: 0 }
            });
        });
        return;
    }

    db.query('SELECT COUNT(*) as new_count, MAX(return_id) as max_id FROM returns WHERE return_id > ?', [lastReturnId], (err, result) => {
        if (err) {
            console.error('Error checking new returns:', err);
            return res.status(500).json({ success: false });
        }
        
        const count = result[0].new_count;
        const maxId = result[0].max_id || lastReturnId;
        
        res.json({
            success: true,
            returns: {
                new_count: count,
                max_id: maxId
            }
        });
    });
};
