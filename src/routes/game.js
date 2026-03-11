const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Rolling endpoints
router.get('/:eventId/rolling/settings', gameController.getRollingSettings);
router.patch('/:eventId/rolling/settings', gameController.updateRollingSettings);
router.get('/:eventId/rolling/participants', gameController.getRollingParticipants);
router.post('/:eventId/rolling/winner', gameController.recordWinner);
router.get('/:eventId/rolling/winners', gameController.getWinners);
router.post('/:eventId/rolling/reset', gameController.resetGame);

// Quiz endpoints
router.post('/quiz/create', gameController.createQuiz);
router.get('/quiz/:id', gameController.getQuiz);
router.post('/quiz/:id/session', gameController.hostQuiz);
router.post('/quiz/session/join', gameController.joinSession);
router.patch('/quiz/session/:pin/submit', gameController.submitAnswer);
router.get('/quiz/session/:pin/leaderboard', gameController.getLeaderboard);

module.exports = router;
