const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

/**
 * @openapi
 * /api/game/{eventId}/rolling/settings:
 *   get:
 *     tags: [Games - Rolling]
 *     summary: Get rolling game settings for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameSetting'
 */
router.get('/:eventId/rolling/settings', gameController.getRollingSettings);

/**
 * @openapi
 * /api/game/{eventId}/rolling/settings:
 *   patch:
 *     tags: [Games - Rolling]
 *     summary: Update rolling game settings
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameSetting'
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.patch('/:eventId/rolling/settings', gameController.updateRollingSettings);

/**
 * @openapi
 * /api/game/{eventId}/rolling/participants:
 *   get:
 *     tags: [Games - Rolling]
 *     summary: Get eligible participants for the rolling game
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:eventId/rolling/participants', gameController.getRollingParticipants);

/**
 * @openapi
 * /api/game/{eventId}/rolling/winner:
 *   post:
 *     tags: [Games - Rolling]
 *     summary: Record a rolling game winner
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, prizeWon]
 *             properties:
 *               userId: { type: string }
 *               prizeWon: { type: string }
 *     responses:
 *       201:
 *         description: Winner recorded
 */
router.post('/:eventId/rolling/winner', gameController.recordWinner);

/**
 * @openapi
 * /api/game/{eventId}/rolling/winners:
 *   get:
 *     tags: [Games - Rolling]
 *     summary: Get all winners for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GameWinner'
 */
router.get('/:eventId/rolling/winners', gameController.getWinners);

/**
 * @openapi
 * /api/game/{eventId}/rolling/reset:
 *   post:
 *     tags: [Games - Rolling]
 *     summary: Reset the rolling game for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game reset successful
 */
router.post('/:eventId/rolling/reset', gameController.resetGame);

/**
 * @openapi
 * /api/game/quiz/create:
 *   post:
 *     tags: [Games - Quiz]
 *     summary: Create a new quiz
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Quiz'
 *     responses:
 *       201:
 *         description: Quiz created
 */
router.post('/quiz/create', gameController.createQuiz);

/**
 * @openapi
 * /api/game/quiz/{id}:
 *   get:
 *     tags: [Games - Quiz]
 *     summary: Get quiz by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 */
router.get('/quiz/:id', gameController.getQuiz);

/**
 * @openapi
 * /api/game/quiz/{id}/session:
 *   post:
 *     tags: [Games - Quiz]
 *     summary: Host a new quiz session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Session created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuizSession'
 */
router.post('/quiz/:id/session', gameController.hostQuiz);

/**
 * @openapi
 * /api/game/quiz/session/join:
 *   post:
 *     tags: [Games - Quiz]
 *     summary: Join a quiz session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin, nickname]
 *             properties:
 *               pin: { type: string }
 *               nickname: { type: string }
 *     responses:
 *       200:
 *         description: Joined successfully
 */
router.post('/quiz/session/join', gameController.joinSession);

/**
 * @openapi
 * /api/game/quiz/session/{pin}/submit:
 *   patch:
 *     tags: [Games - Quiz]
 *     summary: Submit an answer for a quiz question
 *     parameters:
 *       - in: path
 *         name: pin
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionIndex, answer]
 *             properties:
 *               questionIndex: { type: number }
 *               answer: { type: array, items: { type: number } }
 *     responses:
 *       200:
 *         description: Answer submitted
 */
router.patch('/quiz/session/:pin/submit', gameController.submitAnswer);

/**
 * @openapi
 * /api/game/quiz/session/{pin}/leaderboard:
 *   get:
 *     tags: [Games - Quiz]
 *     summary: Get session leaderboard
 *     parameters:
 *       - in: path
 *         name: pin
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/quiz/session/:pin/leaderboard', gameController.getLeaderboard);

module.exports = router;
