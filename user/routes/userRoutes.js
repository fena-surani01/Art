const express = require('express')
const router = express.Router()
const {checkUser} =  require('../middleware/authMiddleware')

const artController = require('../controller/artController');
const orderController = require('../controller/orderController');
const reviewController = require('../controller/reviewController');
const customArtController = require('../controller/customArtController');


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

// Happy Customers Route (Public)
router.get('/happy-customers', customArtController.viewHappyCustomersPage);


// Reviews Routes
router.get('/api/user/reviews/pending', checkUser, reviewController.checkPendingReviews);
router.post('/api/user/reviews/submit', checkUser, reviewController.submitReview);
router.get('/api/reviews/approved', reviewController.getApprovedReviews);

// Custom Art Routes
router.get('/user/custom-art', checkUser, customArtController.viewCustomArtPage);
router.post('/api/custom-art/submit', checkUser, customArtController.upload.single('reference_image'), customArtController.submitCustomRequest);


// Locations API (States & Cities)
const db = require('../config/db');
router.get('/api/locations', (req, res) => {
    db.query("SELECT * FROM states WHERE is_active = 1 OR is_active IS NULL ORDER BY state_name ASC", (err, states) => {
        if (err) return res.status(500).json({ success: false });
        db.query("SELECT c.* FROM cities c JOIN states s ON c.state_id = s.id WHERE (c.is_active = 1 OR c.is_active IS NULL) AND (s.is_active = 1 OR s.is_active IS NULL) ORDER BY c.city_name ASC", (err, cities) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true, states, cities });
        });
    });
});

module.exports = router;
