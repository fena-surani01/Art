const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const adminController = require('../controllers/adminController');
const artistController  = require('../controllers/artistController')
const artController = require('../controllers/artController');
const artImageController = require('../controllers/artImageController');
const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');
const attendanceController = require('../controllers/attendanceController');
const locationController = require('../controllers/locationController');

// Auth Middleware
const auth = require('../middleware/auth')

// ###############  Login 
router.get('/',adminController.loginPage);
router.post('/login',adminController.login);


router.get('/dashboard', auth, (req, res) => {
    res.render('dashboard')
});

router.get('/api/dashboard/stats', auth, adminController.getDashboardStatsAPI);

const artistModel = require('../models/artistModel');
router.get('/profile', auth, (req, res) => {
    if (req.session.admin.role === 'artist') {
        artistModel.getArtistById(req.session.admin.id, (err, result) => {
            if (!err && result.length > 0) {
                res.render("profile", { fullArtist: result[0] });
            } else {
                res.render("profile", { fullArtist: null });
            }
        });
    } else {
        res.render("profile", { fullArtist: null });
    }
});

router.put('/api/profile/update', auth, adminController.updateProfileAPI);

// Attendance Module
router.get('/attendance', auth, attendanceController.viewAttendance);
router.post('/api/attendance/check-in', auth, attendanceController.checkIn);
router.post('/api/attendance/check-out', auth, attendanceController.checkOut);
router.post('/api/attendance/leave', auth, attendanceController.requestLeave);
router.get('/api/attendance/live-status', auth, attendanceController.getLiveStatus);
router.get('/api/attendance/weekly', auth, attendanceController.getArtistWeeklyData);
router.get('/api/attendance/daily', auth, attendanceController.getAdminDailyData);
router.put('/api/attendance/update-status', auth, attendanceController.adminUpdateStatus);

// View Artist
router.get('/artist/view',auth,artistController.viewArtistPage);
router.get('/api/artists',auth,artistController.getArtistsAPI);

// Add Artist
router.get('/artist/add', auth,artistController.addArtistPage);
router.post('/api/artist/add',auth, artistController.addArtistAPI);

// Delete Artist
router.delete('/api/artist/delete/:id',auth,artistController.deleteArtistAPI)

// Edit
router.get('/artist/edit/:id',auth, artistController.editArtistPage);
router.get('/api/artist/:id',auth, artistController.getSingleArtistAPI);
router.put('/api/artist/update/:id',auth, artistController.updateArtistAPI);
router.post('/api/artist/login-as/:id', auth, artistController.loginAsArtistAPI);




// View Art
router.get('/art/view', auth, artController.viewArtPage);
router.get('/api/arts', auth, artController.getArtsAPI);

// Add Art
router.get('/art/add', auth, artController.addArtPage);
router.post('/api/art/add', auth, artController.addArtAPI);

// Delete Art
router.delete('/api/art/delete/:id', auth, artController.deleteArtAPI);

// Edit Art
router.get('/art/edit/:id', auth, artController.editArtPage);
router.get('/api/art/:id', auth, artController.getSingleArtAPI);
router.put('/api/art/update/:id', auth, artController.updateArtAPI);



// Multer 

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join(__dirname, '../../uploads/arts'));
//     },

//     filename: function (req, file, cb) {
//         cb(null, Date.now() + '-' + file.originalname);
//     }
// });
// const upload = multer({ storage: storage });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Add Art Images
router.get('/art-image/add', auth, artImageController.addArtImagePage);

router.post(
    '/api/art-image/add',
    auth,
    upload.array('images'),
    artImageController.addArtImageAPI
);

// View Art Images
router.get('/art-image/view', auth, artImageController.viewArtImagePage);
router.get('/api/art-images', auth, artImageController.getArtImagesAPI);

// Edit Art Image
router.get('/art-image/edit/:id', auth, artImageController.editArtImagePage);
router.get('/api/art-image/:id', auth, artImageController.getSingleArtImageAPI);

router.put(
    '/api/art-image/update/:id',
    auth,
    upload.single('image'),
    artImageController.updateArtImageAPI
);

// Delete Art Image
router.delete('/api/art-image/delete/:id', auth, artImageController.deleteArtImageAPI);

// Orders Menu
router.get('/api/orders/check-new', auth, orderController.checkNewOrdersAPI);
router.get('/orders/view', auth, orderController.viewOrdersPage);
router.get('/api/orders/:id/items', auth, orderController.getOrderDetailsAPI);
router.put('/api/orders/update/:id', auth, orderController.updateOrderStatusAPI);

// Returns Menu
const returnController = require('../controllers/returnController');
router.get('/returns/view', auth, returnController.viewReturnsPage);
router.put('/api/returns/update-status/:id', auth, returnController.updateReturnStatusAPI);
router.get('/api/returns/check-new', auth, returnController.checkNewReturnsAPI);

// Reviews Menu
const reviewController = require('../controllers/reviewController');
router.get('/reviews/view', auth, reviewController.viewReviewsPage);
router.get('/api/reviews/check-new', auth, reviewController.checkNewReviewsAPI);
router.put('/api/reviews/approve/:id', auth, reviewController.approveReviewAPI);

// Custom Requests Routes
const customRequestController = require('../controllers/customRequestController');
router.get('/custom-requests/view', auth, customRequestController.viewCustomRequestsPage);
router.put('/api/custom-requests/update-status/:id', auth, customRequestController.updateCustomRequestStatus);
router.put('/api/custom-requests/update-artist-status/:id', auth, customRequestController.updateArtistStatus);
router.get('/api/custom-requests/check-new', auth, customRequestController.checkNewRequests);
router.put('/api/custom-requests/assign/:id', auth, customRequestController.assignCustomRequest);
router.put('/api/custom-requests/toggle-gallery/:id', auth, customRequestController.toggleGalleryStatus);

// Notifications Routes
const notificationController = require('../controllers/notificationController');
router.get('/api/notifications', auth, notificationController.getNotifications);
router.post('/api/notifications/mark-read/:id', auth, notificationController.markAsRead);
router.post('/api/notifications/mark-all-read', auth, notificationController.markAllAsRead);

// Location Routes (States & Cities)
router.get('/locations/states', auth, locationController.getStatesPage);
router.post('/api/locations/states/add', auth, locationController.addState);
router.put('/api/locations/states/toggle/:id', auth, locationController.toggleStateStatus);
router.delete('/api/locations/states/:id', auth, locationController.deleteState);

router.get('/locations/cities', auth, locationController.getCitiesPage);
router.post('/api/locations/cities/add', auth, locationController.addCity);
router.put('/api/locations/cities/toggle/:id', auth, locationController.toggleCityStatus);
router.delete('/api/locations/cities/:id', auth, locationController.deleteCity);

router.get('/logout', authController.logout);

module.exports = router;