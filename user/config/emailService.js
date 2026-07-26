const nodemailer = require('nodemailer');

async function getTransporter() {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    let pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (user && pass) {
        pass = pass.replace(/\s+/g, '');
        const isGmail = (process.env.SMTP_HOST || '').includes('gmail') || user.includes('@gmail.com');
        
        const transportConfig = isGmail ? {
            service: 'gmail',
            auth: { user, pass }
        } : {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user, pass }
        };

        return nodemailer.createTransport(transportConfig);
    } else {
        try {
            const testAccount = await nodemailer.createTestAccount();
            console.log(`[Email Service] Using Ethereal test account: ${testAccount.user}`);
            return nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
        } catch (err) {
            console.error('[Email Service] Failed to create test account:', err.message);
            return null;
        }
    }
}

const getSenderEmail = () => process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@fenaria.com';

// 1. Order / Custom Art Confirmation Email
async function sendOrderConfirmationEmail({ toEmail, customerName, orderId, isCustom = false, details = {} }) {
    if (!toEmail) {
        console.error('[Email Service] Cannot send confirmation mail: customer toEmail is missing');
        return;
    }

    const title = isCustom ? `Custom Art Request Placed! (#REQ-${orderId})` : `Order Placed Successfully! (#ORD-${orderId})`;
    const refCode = isCustom ? `#REQ-${orderId}` : `#ORD-${orderId}`;
    const estDateStr = details.estDeliveryDate || '5 business days';

    const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E9ECEF; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
        <div style="background: #1A252F; padding: 25px 20px; text-align: center;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 26px;">Fenaria <span style="color: #FC787D;">☘️</span></h1>
            <p style="color: #BDC3C7; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Authentic Artistry</p>
        </div>
        <div style="padding: 30px 25px; color: #2C3E50;">
            <h2 style="color: #1A252F; margin-top: 0;">Order Confirmation</h2>
            <p>Dear <strong>${customerName || 'Valued Customer'}</strong>,</p>
            <p>Thank you for your order! Your ${isCustom ? 'custom art request' : 'art order'} <strong>${refCode}</strong> has been successfully placed and is now being processed.</p>

            <div style="background: #F8F9FA; padding: 15px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FC787D;">
                <p style="margin: 5px 0;"><strong>Order ID:</strong> ${refCode}</p>
                ${details.price ? `<p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${details.price}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Estimated Delivery Date:</strong> <span style="color: #27AE60; font-weight: bold;">${estDateStr}</span></p>
            </div>

            <p style="margin-top: 20px;"><strong>Tracking Your Order:</strong><br>
            You can track your order status anytime using our 24/7 Customer Support assistant on the website or by visiting your <strong>My Orders</strong> page.</p>

            <div style="text-align: center; margin-top: 30px;">
                <a href="https://art-mvgj.onrender.com/user/signin" style="background: #1A252F; color: #FFFFFF; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">View My Order</a>
            </div>
        </div>
        <div style="background: #F8F9FA; padding: 20px; text-align: center; border-top: 1px solid #E9ECEF; font-size: 12px; color: #6C757D;">
            <p style="margin: 0;">Thank you for choosing <strong>Fenaria Art Studio</strong></p>
            <p style="margin: 5px 0 0 0;">Need help? Contact our Customer Support anytime.</p>
        </div>
    </div>
    `;

    try {
        const tr = await getTransporter();
        if (!tr) return;
        const info = await tr.sendMail({
            from: `"Fenaria Art Studio" <${getSenderEmail()}>`,
            to: toEmail,
            subject: title,
            html: html
        });
        console.log(`[Email Service] ✅ Confirmation mail successfully sent to ${toEmail} for ${refCode}! (MessageID: ${info.messageId})`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log(`[Email Service] 📧 Test Preview URL: ${previewUrl}`);
    } catch (err) {
        console.error(`[Email Error] Failed to send confirmation email to ${toEmail}:`, err);
    }
}

// 2. Delivery Day Reminder Email
async function sendDeliveryDayReminderEmail({ toEmail, customerName, orderId, isCustom = false }) {
    if (!toEmail) return;

    const refCode = isCustom ? `#REQ-${orderId}` : `#ORD-${orderId}`;
    const title = `Your Fenaria Order ${refCode} is Expected to Arrive Today! 🚚`;

    const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E9ECEF; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
        <div style="background: #1A252F; padding: 25px 20px; text-align: center;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 26px;">Fenaria <span style="color: #FC787D;">☘️</span></h1>
            <p style="color: #BDC3C7; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Authentic Artistry</p>
        </div>
        <div style="padding: 30px 25px; color: #2C3E50;">
            <h2 style="color: #27AE60; margin-top: 0;">Delivering Today! 🚚</h2>
            <p>Dear <strong>${customerName || 'Valued Customer'}</strong>,</p>
            <p>Great news! Your order <strong>${refCode}</strong> is scheduled to be delivered <strong>today</strong>!</p>
            
            <div style="background: #FEF9E7; border-left: 4px solid #F39C12; padding: 15px 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 16px; color: #D35400; font-weight: bold;">
                    Stay happy... Thank you for your order! ✨
                </p>
            </div>

            <p>Please ensure someone is available at your delivery address to receive your artwork.</p>
        </div>
        <div style="background: #F8F9FA; padding: 20px; text-align: center; border-top: 1px solid #E9ECEF; font-size: 12px; color: #6C757D;">
            <p style="margin: 0;">Thank you for choosing <strong>Fenaria Art Studio</strong></p>
        </div>
    </div>
    `;

    try {
        const tr = await getTransporter();
        if (!tr) return;
        const info = await tr.sendMail({
            from: `"Fenaria Art Studio" <${getSenderEmail()}>`,
            to: toEmail,
            subject: title,
            html: html
        });
        console.log(`[Email Service] ✅ Delivery day reminder mail successfully sent to ${toEmail} for ${refCode}!`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log(`[Email Service] 📧 Test Preview URL: ${previewUrl}`);
    } catch (err) {
        console.error(`[Email Error] Failed to send delivery day email to ${toEmail}:`, err);
    }
}

// 3. Order Delivered & Review Invitation Email
async function sendOrderDeliveredEmail({ toEmail, customerName, orderId, isCustom = false }) {
    if (!toEmail) {
        console.error('[Email Service] Cannot send delivered mail: customer toEmail is missing');
        return;
    }

    const refCode = isCustom ? `#REQ-${orderId}` : `#ORD-${orderId}`;
    const title = `Your Order ${refCode} Has Been Delivered Successfully! 🎉`;

    const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E9ECEF; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
        <div style="background: #1A252F; padding: 25px 20px; text-align: center;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 26px;">Fenaria <span style="color: #FC787D;">☘️</span></h1>
            <p style="color: #BDC3C7; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Authentic Artistry</p>
        </div>
        <div style="padding: 30px 25px; color: #2C3E50;">
            <h2 style="color: #27AE60; margin-top: 0;">Order Delivered Successfully! 🎉</h2>
            <p>Dear <strong>${customerName || 'Valued Customer'}</strong>,</p>
            <p>Your order <strong>${refCode}</strong> is delivered successfully! Enjoy your order!</p>
            
            <div style="background: #F8F9FA; padding: 25px 20px; border-radius: 12px; text-align: center; margin: 25px 0; border: 1px solid #E9ECEF;">
                <h3 style="margin-top: 0; color: #1A252F;">Please Review Your Order ⭐</h3>
                <p style="color: #7F8C8D; margin-bottom: 20px; font-size: 14px;">We would love to hear your thoughts! Click below to leave a rating and review for your artwork.</p>
                <a href="https://art-mvgj.onrender.com/user/signin" style="background: #1A252F; color: #FFFFFF; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 15px; display: inline-block;">
                    Review Your Order
                </a>
            </div>
        </div>
        <div style="background: #F8F9FA; padding: 20px; text-align: center; border-top: 1px solid #E9ECEF; font-size: 12px; color: #6C757D;">
            <p style="margin: 0;">Thank you for choosing <strong>Fenaria Art Studio</strong></p>
        </div>
    </div>
    `;

    try {
        const tr = await getTransporter();
        if (!tr) return;
        const info = await tr.sendMail({
            from: `"Fenaria Art Studio" <${getSenderEmail()}>`,
            to: toEmail,
            subject: title,
            html: html
        });
        console.log(`[Email Service] ✅ Delivered mail successfully sent to ${toEmail} for ${refCode}! (MessageID: ${info.messageId})`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log(`[Email Service] 📧 Test Preview URL: ${previewUrl}`);
    } catch (err) {
        console.error(`[Email Error] Failed to send delivered email to ${toEmail}:`, err);
    }
}

module.exports = {
    sendOrderConfirmationEmail,
    sendDeliveryDayReminderEmail,
    sendOrderDeliveredEmail
};
