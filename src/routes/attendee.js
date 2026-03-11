const express = require('express');
const router = express.Router();
const attendeeController = require('../controllers/attendeeController');

router.get('/event/:eventId', attendeeController.getAttendeesByEvent);
router.get('/event/:eventId/stats', attendeeController.getAttendeeStats);
router.patch('/:id/check-in', attendeeController.checkInAttendee);
router.post('/create', attendeeController.createAttendee);
router.delete('/:id', attendeeController.deleteAttendee);

module.exports = router;
