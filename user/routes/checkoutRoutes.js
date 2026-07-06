const express = require('express');
const router = express.Router();
const checkoutController = require('../controller/checkoutController');
const { checkUser } = require('../middleware/authMiddleware');

router.get('/user/checkout', checkUser, checkoutController.viewCheckoutPage);
router.post('/api/checkout/process', checkUser, checkoutController.processCheckout);
router.get('/user/checkout/success', checkUser, checkoutController.viewSuccessPage);

module.exports = router;
