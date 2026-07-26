const artistModel = require('../models/artistModel') 

// View and Get
exports.viewArtistPage  = (req,res)=>{
    res.render('artist/viewArtist');
}
exports.getArtistsAPI  = (req,res)=>{
    artistModel.getAllArtist((err,result)=>{
        if(err){
            return res.json({
                status : 'error',
                message : 'Something went wrong'
            })
        }
        res.json({
            status : 'success',
            data : result
        })
    })
}

// Add 
exports.addArtistPage  = (req,res)=>{
    res.render('artist/addArtist');
}

exports.addArtistAPI = (req,res)=>{
    const {artist_name, gender, description, email, password, salary, join_date} = req.body;
    
    if (!artist_name || !gender || !email || !password) {
        return res.json({
            status: 'error',
            message: 'Artist name, gender, email, and password are required !!'
        });
    }

    artistModel.addArtist(artist_name, gender, description || null, email, password, salary || 0, join_date || null, (err, result)=>{
        if(err)
        {
            return res.json({
                status: 'error',
                message: 'Something went wrong'
            });
        }
        res.json({
            status: 'success',
            message: 'Artist added successfully'
        });
    })
}

// Delete 
exports.deleteArtistAPI  = (req,res)=>{
    const artist_id = req.params.id;
    artistModel.deleteArtist(artist_id,(err,result)=>{
        if(err)
        {
            return res.json({
                status : 'error',
                message : err.message
            });
        }
         res.json({
            status : 'success',
            message : 'Artist Deleted Successfully'
        });
    })
}

// Edit Fetch

exports.editArtistPage = (req, res) => {
    res.render('artist/editArtist');
};
exports.getSingleArtistAPI = (req, res) => {
    const artist_id = req.params.id;

    artistModel.getArtistById(artist_id, (err, result) => {
        if (err) {
            return res.json({
                status: 'error',
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.json({
                status: 'error',
                message: 'Artist not found'
            });
        }

        res.json({
            status: 'success',
            data: result[0]
        });
    });
};


// Edit 
exports.updateArtistAPI = (req, res) => {
    const artist_id = req.params.id;
    const { artist_name, gender, description, email, password, salary, join_date } = req.body;

    if (!artist_name || !gender || !email) {
        return res.json({
            status: 'error',
            message: 'Artist name, gender, and email are required'
        });
    }

    artistModel.updateArtist(artist_id, artist_name, gender, description || null, email, password, salary || 0, join_date || null, (err, result) => {
        if (err) {
            return res.json({
                status: 'error',
                message: err.message
            });
        }

        res.json({
            status: 'success',
            message: 'Artist updated successfully'
        });
    });
};

// Login As
exports.loginAsArtistAPI = (req, res) => {
    const artist_id = req.params.id;
    artistModel.getArtistById(artist_id, (err, result) => {
        if (err || result.length === 0) {
            return res.json({
                status: 'error',
                message: 'Failed to login as artist'
            });
        }
        
        req.session.admin = {
            id: result[0].artist_id,
            name: result[0].artist_name,
            email: result[0].email,
            role: 'artist'
        };

        res.json({
            status: 'success',
            message: 'Logged in as artist successfully'
        });
    });
};