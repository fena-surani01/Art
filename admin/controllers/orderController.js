const orderModel = require('../models/orderModel');

const viewOrdersPage = (req, res) => {
    orderModel.getAllOrders((err, orders) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error loading orders");
        }
        res.render('orders', { orders: orders });
    });
};

const getOrderDetailsAPI = (req, res) => {
    const { id } = req.params;
    orderModel.getOrderItems(id, (err, items) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to get items' });
        }
        res.json({ success: true, items: items });
    });
};

const updateOrderStatusAPI = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    orderModel.updateOrderStatus(id, status, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to update status' });
        }
        res.json({ success: true, message: 'Status updated successfully' });
    });
};

const checkNewOrdersAPI = (req, res) => {
    const lastOrderId = req.query.lastOrderId;
    orderModel.checkNewOrders(lastOrderId, (err, results) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, new_count: 0, max_id: null });
        }
        
        let response = {
            success: true,
            cancelled_count: results.cancelled_count,
            out_of_stock_count: results.out_of_stock_count
        };

        if (!lastOrderId || lastOrderId == 'null') {
            response.max_id = results.orders.max_id || 0;
            response.new_count = 0;
        } else {
            response.max_id = results.orders.max_id || lastOrderId;
            response.new_count = results.orders.new_count || 0;
        }
        
        res.json(response);
    });
};

module.exports = {
    viewOrdersPage,
    getOrderDetailsAPI,
    updateOrderStatusAPI,
    checkNewOrdersAPI
};
