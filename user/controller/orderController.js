const orderModel = require('../models/orderModel');

const viewUserOrdersPage = (req, res) => {
    const user = req.session.user;
    if (!user || !user.id) {
        return res.redirect('/user/signin');
    }

    const customArtModel = require('../models/customArtModel');
    
    orderModel.getUserOrders(user.id, (err, orders) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error loading orders");
        }
        
        customArtModel.getCustomRequestsByUserId(user.id, (err, customRequests) => {
            if (err) {
                console.error(err);
                customRequests = [];
            }
            res.render('orders', { user: user, orders: orders, customRequests: customRequests });
        });
    });
};

const cancelUserOrder = (req, res) => {
    const user = req.session.user;
    if (!user || !user.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    orderModel.cancelOrder(id, user.id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to cancel order' });
        }
        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
        }
        res.json({ success: true, message: 'Order cancelled successfully' });
    });
};

const trackOrder = (req, res) => {
    const { orderId } = req.params;
    if (!orderId) {
        return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    orderModel.trackOrder(orderId, (err, order) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, order: order });
    });
};

const requestReturn = (req, res) => {
    const user = req.session.user;
    if (!user || !user.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { order_id, reason, other_reason } = req.body;
    const returnModel = require('../models/returnModel');
    
    returnModel.addReturnRequest(order_id, user.id, reason, other_reason, (err, result) => {
        if (err) {
            console.error("Return error:", err);
            return res.status(500).json({ success: false, message: 'Failed to process return request' });
        }
        
        const estPickup = result.estimated_pickup;
        const pickupDateStr = estPickup.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        res.json({ success: true, estimated_pickup: pickupDateStr });
    });
};

module.exports = {
    viewUserOrdersPage,
    cancelUserOrder,
    trackOrder,
    requestReturn
};
