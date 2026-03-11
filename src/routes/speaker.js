const express = require('express');
const router = express.Router();
const speakerController = require('../controllers/speakerController');

router.get('/event/:eventId', speakerController.getSpeakersByEvent);
router.post('/create', speakerController.createSpeaker);
router.get('/:id', speakerController.getSpeaker);
router.put('/edit/:id', speakerController.updateSpeaker);
router.delete('/:id', speakerController.deleteSpeaker);
router.post('/:id/sessions', speakerController.manageSessions);

module.exports = router;
