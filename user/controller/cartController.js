const cartModel = require('../models/cartModel');

const addToCart = (req, res) => {
    const userId = req.session.user?.id;
    const { artId } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Please login to add items to cart.' });
    }

    cartModel.addToCart(userId, artId, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to add item to cart' });
        }
        res.json({ success: true, message: 'Item added to basket successfully!' });
    });
};

const viewCartPage = (req, res) => {
    const userId = req.session.user?.id;
    
    if (!userId) {
        return res.redirect('/user/signin');
    }

    cartModel.getCartByUserId(userId, (err, cartItems) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching cart items");
        }

        let total = 0;
        cartItems.forEach(item => {
            total += parseFloat(item.price) * item.quantity;
        });

        const shipping = (total > 0 && total <= 1000) ? 100 : 0;
        const finalTotal = total + shipping;

        res.render('cart', {
            user: req.session.user,
            cartItems: cartItems,
            subTotal: total.toFixed(2),
            shipping: shipping.toFixed(2),
            finalTotal: finalTotal.toFixed(2)
        });
    });
};

const removeCartItem = (req, res) => {
    const userId = req.session.user?.id;
    const { cartId } = req.params;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    cartModel.removeFromCart(cartId, userId, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to remove item' });
        }
        res.json({ success: true, message: 'Item removed successfully' });
    });
};

const updateQuantity = (req, res) => {
    const userId = req.session.user?.id;
    const { cartId } = req.params;
    const { quantity } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (quantity < 1) {
        return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    cartModel.updateCartQuantity(cartId, userId, quantity, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to update quantity' });
        }
        res.json({ success: true, message: 'Quantity updated' });
    });
};

const getCartCount = (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) {
        return res.json({ success: true, count: 0 });
    }
    
    cartModel.getCartCount(userId, (err, count) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, count: 0 });
        }
        res.json({ success: true, count: count });
    });
};

const getCartItemIds = (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) {
        return res.json({ success: true, artIds: [] });
    }
    cartModel.getCartItemIds(userId, (err, ids) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, artIds: [] });
        }
        res.json({ success: true, artIds: ids });
    });
};

module.exports = {
    addToCart,
    viewCartPage,
    removeCartItem,
    updateQuantity,
    getCartCount,
    getCartItemIds
};
