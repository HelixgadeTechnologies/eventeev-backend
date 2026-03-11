const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

router.get('/event/:eventId', pollController.getPollsByEvent);
router.post('/create', auth, pollController.createPoll);
router.get('/:id', pollController.getPollResults);
router.patch('/:id/status', auth, pollController.updatePollStatus);
router.post('/:id/vote', auth, pollController.submitVote);
router.delete('/:id', auth, pollController.deletePoll);

module.exports = router;
