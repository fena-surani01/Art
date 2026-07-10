const express = require('express')
const router = express.Router()
const {checkUser} =  require('../middleware/authMiddleware')

const artController = require('../controller/artController');
const orderController = require('../controller/orderController');


router.get('/user/home',checkUser,(req,res)=>{
    res.render('home', {
        user: req.session.user
    });
})

router.get('/user/art/:id', checkUser, artController.viewArtDetailsPage);



// User Orders Routes
router.get('/user/orders', checkUser, orderController.viewUserOrdersPage);
router.put('/api/user/orders/:id/cancel', checkUser, orderController.cancelUserOrder);
router.post('/api/orders/return', checkUser, orderController.requestReturn);
router.get('/api/user/orders/track/:orderId', orderController.trackOrder); // Open to all for tracking


// Reviews Routes
const reviewController = require('../controller/reviewController');
router.get('/api/user/reviews/pending', checkUser, reviewController.checkPendingReviews);
router.post('/api/user/reviews/submit', checkUser, reviewController.submitReview);
router.get('/api/reviews/approved', checkUser, reviewController.getApprovedReviews);

// Custom Art Routes
const customArtController = require('../controller/customArtController');
router.get('/user/custom-art', checkUser, customArtController.viewCustomArtPage);
router.post('/api/custom-art/submit', checkUser, customArtController.upload.single('reference_image'), customArtController.submitCustomRequest);


// Locations API (States & Cities)
const db = require('../config/db');
router.get('/api/locations', (req, res) => {
    db.query("SELECT * FROM states ORDER BY state_name ASC", (err, states) => {
        if (err) return res.status(500).json({ success: false });
        db.query("SELECT * FROM cities ORDER BY city_name ASC", (err, cities) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true, states, cities });
        });
    });
});

module.exports = router