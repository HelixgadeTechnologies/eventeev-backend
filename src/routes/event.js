const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');

router.get('/published', eventController.getPublishedEvents);
router.get('/drafts', auth, eventController.getDrafts);
router.get('/completed', auth, eventController.getCompletedEvents);
router.post('/publish', auth, eventController.publishEvent);
router.post('/drafttolive/:id', auth, eventController.draftToLive);
router.delete('/:id', auth, eventController.deleteEvent);

module.exports = router;
