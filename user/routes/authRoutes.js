const express = require('express')
const router = express.Router()
const authController = require('../controller/authController')
const artController = require('../controller/artController')

// Sign up
router.get('/user/signup',authController.signupPage)
router.post('/user/signup',authController.signUp)

// Sign in
router.get('/user/signin',authController.signinPage)
router.post('/user/signin',authController.signin)

// Home
router.get('/', (req,res) => {
    res.redirect('/user/home');
});

router.get('/user', (req,res) => {
    res.redirect('/user/signin');
});

router.get('/user/logout',(req,res)=>{
    if (req.session.user && req.session.user.id) {
        const authModel = require('../models/authModel');
        authModel.setOnlineStatus(req.session.user.id, 0, (err) => {
            if (err) console.error("Failed to set offline:", err);
            req.session.destroy(()=>{
                res.redirect('/user/signin');
            });
        });
    } else {
        req.session.destroy(()=>{
            res.redirect('/user/signin');
        });
    }
});


module.exports = router;