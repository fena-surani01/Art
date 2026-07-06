const cartModel = require('../models/cartModel');
const checkoutModel = require('../models/checkoutModel');
const userModel = require('../models/authModel'); // or whatever user model we have, we'll fetch user details from session for now

const viewCheckoutPage = (req, res) => {
    const user = req.session.user;
    if (!user || !user.id) {
        return res.redirect('/user/signin');
    }

    cartModel.getCartByUserId(user.id, (err, cartItems) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching cart items");
        }

        if (cartItems.length === 0) {
            return res.redirect('/user/cart'); // Don't allow checkout with empty cart
        }

        let total = 0;
        cartItems.forEach(item => {
            total += parseFloat(item.price) * item.quantity;
        });

        const shipping = (total > 0 && total <= 1000) ? 100 : 0;
        const finalTotal = total + shipping;

        // Fetch user from DB to get default address if any
        const db = require('../config/db');
        db.query("SELECT * FROM user WHERE id = ?", [user.id], (err, users) => {
            const dbUser = users && users.length > 0 ? users[0] : user;

            res.render('checkout', {
                user: dbUser,
                cartItems: cartItems,
                subTotal: total.toFixed(2),
                shipping: shipping.toFixed(2),
                finalTotal: finalTotal.toFixed(2)
            });
        });
    });
};

const processCheckout = (req, res) => {
    const user = req.session.user;
    if (!user || !user.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const details = req.body;
    
    // Calculate totals again to prevent tampering
    cartModel.getCartByUserId(user.id, (err, cartItems) => {
        if (err || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty or error occurred.' });
        }

        let total = 0;
        cartItems.forEach(item => {
            total += parseFloat(item.price) * item.quantity;
        });

        const shipping = (total > 0 && total <= 1000) ? 100 : 0;
        const finalTotal = total + shipping;

        // 1. Update User Details in DB (save for next time)
        checkoutModel.updateUserDetails(user.id, details, () => {
            // 2. Create Order
            checkoutModel.createOrder(user.id, finalTotal, details, (err, orderId) => {
                if (err) {
                    console.error("Create Order Error:", err);
                    return res.status(500).json({ success: false, message: 'Failed to create order' });
                }

                // 3. Add Order Items
                checkoutModel.addOrderItems(orderId, cartItems, (err) => {
                    if (err) {
                        console.error("Add Order Items Error:", err);
                        return res.status(500).json({ success: false, message: 'Failed to add order items' });
                    }

                    // 4. Deduct Stock
                    checkoutModel.deductStock(cartItems, (err) => {
                        if (err) console.error("Deduct Stock Error:", err);

                        // 5. Clear Cart
                        checkoutModel.clearCart(user.id, (err) => {
                            if (err) {
                                console.error("Clear Cart Error:", err);
                            }
                            
                            // Checkout Complete!
                            res.json({ success: true, message: 'Order placed successfully!', orderId: orderId });
                        });
                    });
                });
            });
        });
    });
};

const viewSuccessPage = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.render('checkout-success', { user: req.session.user });
};

module.exports = {
    viewCheckoutPage,
    processCheckout,
    viewSuccessPage
};
