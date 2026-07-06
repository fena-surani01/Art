const adminModel = require('../models/adminModel');

exports.loginPage = ((req,res)=>{
    res.render('login')
})

exports.login = ((req,res)=>{
    const {email, password, role} = req.body;

    if(!email || !password || !role)
    {
        return res.json({ success: false, message: "All fields are Required !!" });
    }

    if (role === 'admin') {
        adminModel.checkAdmin(email,password,(err,result)=>{
            if(err) throw err;
            if(result.length > 0)
            {
                req.session.admin = result[0];
                req.session.admin.role = 'admin';
                return res.json({ success: true, message: "Admin Login Successful" });
            }
            else
            {
                return res.json({ success: false, message: "Invalid Admin Email or Password !!" });
            }
        });
    } else if (role === 'artist') {
        adminModel.checkArtist(email,password,(err,result)=>{
            if(err) throw err;
            if(result.length > 0)
            {
                req.session.admin = {
                    id: result[0].artist_id,
                    name: result[0].artist_name,
                    email: result[0].email,
                    role: 'artist',
                    original_artist_data: result[0]
                };
                adminModel.updateArtistOnlineStatus(result[0].artist_id, true, () => {
                    return res.json({ success: true, message: "Artist Login Successful" });
                });
            }
            else
            {
                return res.json({ success: false, message: "Invalid Artist Email or Password !!" });
            }
        });
    }
})

exports.getDashboardStatsAPI = (req, res) => {
    const filter = req.query.filter || 'today';
    adminModel.getDashboardStats(filter, req.session.admin, (err, stats) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, stats });
    });
};

exports.updateProfileAPI = (req, res) => {
    const { name, email, password } = req.body;
    const role = req.session.admin.role;
    const id = req.session.admin.id;

    if (!name || !email) {
        return res.json({ success: false, message: 'Name and email are required' });
    }

    if (role === 'admin') {
        const adminModel = require('../models/adminModel');
        adminModel.updateAdmin(id, name, email, password, (err, result) => {
            if (err) return res.json({ success: false, message: 'Failed to update profile' });
            req.session.admin.name = name;
            req.session.admin.email = email;
            res.json({ success: true, message: 'Profile updated successfully' });
        });
    } else if (role === 'artist') {
        const artistModel = require('../models/artistModel');
        // Fetch current artist to keep salary/join_date unchanged
        artistModel.getArtistById(id, (err, result) => {
            if (err || result.length === 0) return res.json({ success: false, message: 'Artist not found' });
            const currentArtist = result[0];
            artistModel.updateArtist(id, name, currentArtist.gender, email, password, currentArtist.salary, currentArtist.join_date, (err, updateResult) => {
                if (err) return res.json({ success: false, message: 'Failed to update profile' });
                req.session.admin.name = name;
                req.session.admin.email = email;
                res.json({ success: true, message: 'Profile updated successfully' });
            });
        });
    }
};
