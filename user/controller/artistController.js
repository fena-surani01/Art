const artistModel = require('../models/artistModel');

exports.getArtistsPage = (req, res) => {
    artistModel.getAllArtistsWithArtCount((err, artists) => {
        if (err) {
            console.error("Error fetching artists:", err);
            return res.status(500).send("Database error");
        }
        res.render('artists', { artists: artists });
    });
};
