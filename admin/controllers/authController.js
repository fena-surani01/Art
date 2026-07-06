const adminModel = require('../models/adminModel');

exports.logout = (req, res) => {
    if (req.session.admin && req.session.admin.role === 'artist') {
        adminModel.updateArtistOnlineStatus(req.session.admin.id, false, () => {
            req.session.destroy((err) => {
                if (err) {
                    console.log(err);
                    return res.redirect('/admin/dashboard');
                }
                res.redirect('/admin/');
            });
        });
    } else {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
                return res.redirect('/admin/dashboard');
            }
            res.redirect('/admin/');
        });
    }
};

