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

module.exports = {
    viewUserOrdersPage,
    cancelUserOrder
};
