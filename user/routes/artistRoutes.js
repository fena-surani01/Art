const express = require('express');
const router = express.Router();
const artistController = require('../controller/artistController');

const { checkUser } = require('../middleware/authMiddleware');

router.get('/user/artists', checkUser, artistController.getArtistsPage);

module.exports = router;
