const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/auth');

// @route   POST api/schedule
router.post('/', auth, scheduleController.createScheduleItem);
router.get('/event/:eventId', scheduleController.getEventSchedule);

module.exports = router;
