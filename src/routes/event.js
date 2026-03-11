const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/published', eventController.getPublishedEvents);
router.get('/drafts', eventController.getDrafts);
router.get('/completed', eventController.getCompletedEvents);
router.post('/publish', eventController.publishEvent);
router.post('/drafttolive/:id', eventController.draftToLive);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
