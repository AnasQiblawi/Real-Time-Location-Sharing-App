// Dependencies
const express = require('express');
const router = express.Router();

// Countrollers
const locationController = require('../controllers/locationController');


// Routes
router.get('/', locationController.renderShareLocation);
router.get('/sharingid/:id', locationController.renderWatchLocation);



module.exports = router;