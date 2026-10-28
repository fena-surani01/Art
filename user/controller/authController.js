const authModel = require('../models/authModel');
const bcrypt = require('bcrypt');

exports.signupPage = (req, res) => {
    res.render('signup');
};

exports.signinPage = (req, res) => {
    res.render('signin');
};

exports.signUp = (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({
            status: 'error',
            message: 'All Fields are Required'
        });
    }

    authModel.checkemail(email, (err, result) => {
        if (err) {
            console.error("Signup checkemail error:", err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error: ' + (err.message || 'Unable to connect to database')
            });
        }

        if (result && result.length > 0) {
            return res.json({
                status: 'error',
                message: 'Email is already Exists !!'
            });
        }

        bcrypt.hash(password, 10, (err, hashpassword) => {
            if (err) {
                console.error("Signup hash error:", err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error processing password'
                });
            }

            authModel.signUp(name, email, hashpassword, (err, result) => {
                if (err) {
                    console.error("Signup insert error:", err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Database error: ' + (err.message || 'Failed to create user')
                    });
                }

                return res.json({
                    status: 'success',
                    message: 'You are sign Up Successfully'
                });
            });
        });
    });
};

exports.signin = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({
            status: 'error',
            message: 'All Fields are Required'
        });
    }

    authModel.checklogin(email, (err, result) => {
        if (err) {
            console.error("Signin checklogin error:", err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error: ' + (err.message || 'Unable to connect to database')
            });
        }

        if (!result || result.length === 0) {
            return res.json({
                status: 'error',
                message: 'Invalid Email !!'
            });
        }

        bcrypt.compare(password, result[0].password, (err, isMatch) => {
            if (err) {
                console.error("Signin compare error:", err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error verifying password'
                });
            }

            if (!isMatch) {
                return res.json({
                    status: 'error',
                    message: 'Invalid Password !!'
                });
            }

            req.session.user = result[0];

            authModel.setOnlineStatus(result[0].id, 1, (err) => {
                if (err) console.error("Failed to set online status:", err);
            });

            return res.json({
                status: 'success',
                message: 'Login Successfully',
                redirect: '/user/home'
            });
        });
    });
};
