const db = require('../config/db');
const emailService = require('../config/emailService');

function checkAndSendDeliveryReminders() {
    // 1. Check Standard Orders
    const orderQuery = `
        SELECT o.order_id, u.name as customer_name, u.email as customer_email
        FROM orders o
        JOIN user u ON o.user_id = u.id
        WHERE o.status NOT IN ('Delivered', 'Cancelled')
          AND o.delivery_mail_sent = 0
          AND DATE(DATE_ADD(o.created_at, INTERVAL 5 DAY)) <= CURDATE()
    `;

    db.query(orderQuery, (err, orders) => {
        if (!err && orders && orders.length > 0) {
            orders.forEach(order => {
                if (order.customer_email) {
                    emailService.sendDeliveryDayReminderEmail({
                        toEmail: order.customer_email,
                        customerName: order.customer_name,
                        orderId: order.order_id,
                        isCustom: false
                    });
                    // Mark as sent
                    db.query("UPDATE orders SET delivery_mail_sent = 1 WHERE order_id = ?", [order.order_id]);
                }
            });
        }
    });

    // 2. Check Custom Art Requests
    const customQuery = `
        SELECT cr.request_id, u.name as customer_name, u.email as customer_email
        FROM custom_requests cr
        JOIN user u ON cr.user_id = u.id
        WHERE cr.status NOT IN ('Delivered', 'Cancelled')
          AND cr.delivery_mail_sent = 0
          AND DATE(DATE_ADD(cr.created_at, INTERVAL 5 DAY)) <= CURDATE()
    `;

    db.query(customQuery, (err, requests) => {
        if (!err && requests && requests.length > 0) {
            requests.forEach(req => {
                if (req.customer_email) {
                    emailService.sendDeliveryDayReminderEmail({
                        toEmail: req.customer_email,
                        customerName: req.customer_name,
                        orderId: req.request_id,
                        isCustom: true
                    });
                    // Mark as sent
                    db.query("UPDATE custom_requests SET delivery_mail_sent = 1 WHERE request_id = ?", [req.request_id]);
                }
            });
        }
    });
}

// Start cron check: Run on start and every 6 hours
function initDeliveryReminderCron() {
    // Initial check after 10 seconds of app start
    setTimeout(checkAndSendDeliveryReminders, 10000);
    // Recurring check every 6 hours (6 * 60 * 60 * 1000 ms)
    setInterval(checkAndSendDeliveryReminders, 6 * 60 * 60 * 1000);
}

module.exports = {
    checkAndSendDeliveryReminders,
    initDeliveryReminderCron
};
