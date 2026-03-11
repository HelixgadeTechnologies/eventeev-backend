const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.post('/', scheduleController.createSchedule);
router.get('/event/:eventId', scheduleController.getEventSchedule);

module.exports = router;
