const customArtModel = require('../models/customArtModel');
const multer = require('multer');
const path = require('path');
const imagekit = require('../config/imagekit');

// Configure Multer for Memory Storage (required for ImageKit)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const viewCustomArtPage = (req, res) => {
    res.render('customArt', {
        user: req.session.user
    });
};

const submitCustomRequest = (req, res) => {
    const { 
        size, format, qty, description,
        shipping_address, shipping_city, shipping_state, shipping_zip, 
        phone_number, payment_method 
    } = req.body;
    
    const user_id = req.session.user.id;
    
    // Auto-calculate expected price for backend safety
    let basePrice = format === 'Color' ? 2000 : 1000;
    let sizeMultiplier = 1;
    if (size === 'A3') sizeMultiplier = 1.5;
    if (size === 'A2') sizeMultiplier = 2.0;
    
    const subTotal = (basePrice * sizeMultiplier) * (parseInt(qty) || 1);
    const shippingFee = (subTotal > 0 && subTotal <= 1000) ? 100 : 0;
    const estimated_price = subTotal + shippingFee;

    const data = {
        user_id,
        reference_image: null,
        description,
        size,
        format,
        qty: parseInt(qty) || 1,
        estimated_price,
        imagekit_file_id: null,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        phone_number,
        payment_method,
        payment_status: payment_method === 'COD' ? 'Pending' : 'Completed' // Mock logic for simplicity
    };

    if (req.file) {
        imagekit.upload({
            file: req.file.buffer,
            fileName: Date.now() + '-' + req.file.originalname,
            folder: '/user/custom_requests'
        }, (err, ikResponse) => {
            if (err) {
                console.error("ImageKit upload error:", err);
                return res.json({ success: false, message: 'Failed to upload image' });
            }
            
            data.reference_image = ikResponse.url;
            data.imagekit_file_id = ikResponse.fileId;
            
            insertCustomRequest(data, res);
        });
    } else {
        insertCustomRequest(data, res);
    }
};

const insertCustomRequest = (data, res) => {
    customArtModel.addCustomRequest(data, (err, result) => {
        if (err) {
            console.error("Error inserting custom request:", err);
            return res.json({ success: false, message: 'Failed to submit request' });
        }

        const requestId = result ? result.insertId : null;

        // Send Confirmation Email
        const db = require('../config/db');
        db.query("SELECT name, email FROM user WHERE id = ?", [data.user_id], (uErr, uRes) => {
            const userEmail = (uRes && uRes.length > 0 && uRes[0].email) ? uRes[0].email : null;
            const userName = (uRes && uRes.length > 0 && uRes[0].name) ? uRes[0].name : 'Customer';

            if (userEmail) {
                console.log(`[Custom Art Email] 📬 Dispatching confirmation email TO customer login email: ${userEmail} for Request #${requestId}`);
                const estDate = new Date();
                estDate.setDate(estDate.getDate() + 5);
                const estDateStr = estDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

                const emailService = require('../config/emailService');
                emailService.sendOrderConfirmationEmail({
                    toEmail: userEmail,
                    customerName: userName,
                    orderId: requestId,
                    isCustom: true,
                    details: { price: data.estimated_price, estDeliveryDate: estDateStr }
                });
            } else {
                console.error(`[Custom Art Email] ❌ No email found for user ID: ${data.user_id}`);
            }
        });

        res.json({ success: true, message: 'Request submitted successfully' });
    });
};

const viewHappyCustomersPage = (req, res) => {
    customArtModel.getHappyCustomers((err, results) => {
        if (err) {
            console.error("Error fetching happy customers:", err);
            results = [];
        }
        res.render('happyCustomers', {
            user: (req.session && req.session.user) ? req.session.user : null,
            customers: results || []
        });
    });
};

module.exports = {
    viewCustomArtPage,
    submitCustomRequest,
    upload,
    viewHappyCustomersPage
};
