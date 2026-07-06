const express = require('express');
const router = express.Router();
const cartController = require('../controller/cartController');
const { checkUser } = require('../middleware/authMiddleware');

router.post('/api/cart', checkUser, cartController.addToCart);
router.get('/user/cart', checkUser, cartController.viewCartPage);
router.delete('/api/cart/:cartId', checkUser, cartController.removeCartItem);
router.put('/api/cart/:cartId/quantity', checkUser, cartController.updateQuantity);
router.get('/api/cart/count', checkUser, cartController.getCartCount);
router.get('/api/cart/items', checkUser, cartController.getCartItemIds);

module.exports = router;
