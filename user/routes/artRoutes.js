const express = require('express')
const router = express.Router()
const { checkUser } = require('../middleware/authMiddleware');

const artController = require('../controller/artController')
// Arts
router.get('/api/arts', checkUser, artController.getArts)


module.exports = router