const artModel = require('../models/artModel');
const artistModel = require('../models/artistModel');

// View page
exports.viewArtPage = (req, res) => {
    res.render('art/viewArt');
};

// Get all arts API
exports.getArtsAPI = (req, res) => {
    artModel.getAllArts((err, result) => {
        if (err) {
            return res.json({
                status: 'error',
                message: 'Something went wrong'
            });
        }

        res.json({
            status: 'success',
            data: result
        });
    });
};

// Add page
exports.addArtPage = (req, res) => {
    artistModel.getAllArtist((err, artists) => {
        if (err) {
            artists = [];
        }

        res.render('art/addArt', { artists });
    });
};

// Add API
exports.addArtAPI = (req, res) => {
    const { title, description, category, art_type, artist_name, price, art_size, stock } = req.body;

    if (!title || !category || !art_type || !artist_name || !price || !art_size) {
        return res.json({
            status: 'error',
            message: 'Required fields are missing'
        });
    }

    artModel.addArt(title, description, category, art_type, artist_name, price, art_size, stock || 1, (err, result) => {
        if (err) {
            return res.json({
                status: 'error',
                message: err.message
            });
        }

        res.json({
            status: 'success',
            message: 'Art added successfully'
        });
    });
};

// Delete API
exports.deleteArtAPI = (req, res) => {
    const art_id = req.params.id;

    artModel.deleteArt(art_id, (err, result) => {
        if (err) {
            return res.json({
                status: 'error',
                message: err.message
            });
        }

        res.json({
            status: 'success',
            message: 'Art deleted successfully'
        });
    });
};

// Edit page
exports.editArtPage = (req, res) => {
    artistModel.getAllArtist((err, artists) => {
        if (err) {
            artists = [];
        }

        res.render('art/editArt', { artists });
    });
};

// Get single API
exports.getSingleArtAPI = (req, res) => {
    const art_id = req.params.id;

    artModel.getArtById(art_id, (err, result) => {
        if (err) {
            return res.json({
                status: 'error',
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.json({
                status: 'error',
                message: 'Art not found'
            });
        }

        res.json({
            status: 'success',
            data: result[0]
        });
    });
};

// Update API
exports.updateArtAPI = (req, res) => {
    const art_id = req.params.id;
    const { title, description, category, art_type, artist_name, price, art_size, stock } = req.body;

    if (!title || !category || !art_type || !artist_name || !price || !art_size) {
        return res.json({
            status: 'error',
            message: 'Required fields are missing'
        });
    }

    artModel.updateArt(art_id, title, description, category, art_type, artist_name, price, art_size, stock || 1, (err, result) => {
        if (err) {
            return res.json({
                status: 'error',
                message: err.message
            });
        }

        res.json({
            status: 'success',
            message: 'Art updated successfully'
        });
    });
};