const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const auth = require('../middleware/auth');
const multiAuth = require('../middleware/multiAuth');


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
router.get('/:eventId/rolling/settings', auth, gameController.getRollingSettings);

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
router.patch('/:eventId/rolling/settings', auth, gameController.updateRollingSettings);

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
router.get('/:eventId/rolling/participants', auth, gameController.getRollingParticipants);

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
router.post('/:eventId/rolling/winner', auth, gameController.recordWinner);

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
router.get('/:eventId/rolling/winners', auth, gameController.getWinners);

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
router.post('/:eventId/rolling/reset', auth, gameController.resetGame);

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
router.post('/quiz/create', auth, gameController.createQuiz);

/**
 * @openapi
 * /api/game/quiz/templates:
 *   get:
 *     tags: [Games - Quiz]
 *     summary: Get all template and featured quizzes
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/quiz/templates', gameController.getTemplateQuizzes);

/**
 * @openapi
 * /api/game/quiz/event/{eventId}:
 *   get:
 *     tags: [Games - Quiz]
 *     summary: Get all quizzes for an event
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
router.get('/quiz/event/:eventId', gameController.getQuizzesByEvent);

/**
 * @openapi
 * /api/game/quiz/{id}/clone:
 *   post:
 *     tags: [Games - Quiz]
 *     summary: Clone a template quiz to an event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId]
 *             properties:
 *               eventId: { type: string }
 *     responses:
 *       201:
 *         description: Cloned successfully
 */
router.post('/quiz/:id/clone', auth, gameController.cloneQuiz);

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
router.get('/quiz/:id', auth, gameController.getQuiz);

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
router.post('/quiz/:id/session', auth, gameController.hostQuiz);

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
 *     summary: Submit an answer for a quiz question (Kahoot-style speed & accuracy scoring)
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
 *             required: [questionIndex]
 *             properties:
 *               userId: { type: string, description: "Registered User ID or Participant ID" }
 *               nickname: { type: string, description: "Player nickname (if guest)" }
 *               questionIndex: { type: number, description: "Zero-based question index" }
 *               answer: { type: array, items: { type: number }, description: "Zero-based indices of chosen answers" }
 *               answerIndex: { type: number, description: "Legacy single-choice index" }
 *               timeTaken: { type: number, description: "Seconds taken to answer since question started" }
 *     responses:
 *       200:
 *         description: Answer evaluated and Kahoot points awarded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isCorrect: { type: boolean }
 *                 basePoints: { type: number, description: "Speed-scaled base points (500 - 1000)" }
 *                 streakBonus: { type: number, description: "Bonus points for consecutive correct answers" }
 *                 points: { type: number, description: "Total points awarded for this answer" }
 *                 streak: { type: number, description: "Current consecutive correct answer streak" }
 *                 currentScore: { type: number, description: "Player cumulative score in this session" }
 *       400:
 *         description: Question already answered or invalid question index
 *       404:
 *         description: Session or participant not found
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

/**
 * @openapi
 * /api/game/quiz/session/{pin}:
 *   get:
 *     tags: [Games - Quiz]
 *     summary: Get quiz session status and active question
 *     parameters:
 *       - in: path
 *         name: pin
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Session not found
 */
router.get('/quiz/session/:pin', gameController.getSession);

/**
 * @openapi
 * /api/game/quiz/session/{pin}/start:
 *   post:
 *     tags: [Games - Quiz]
 *     summary: Start quiz session (Host / Admin)
 *     parameters:
 *       - in: path
 *         name: pin
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz session started and question 1 broadcasted
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
router.post('/quiz/session/:pin/start', multiAuth, gameController.startSession);

/**
 * @openapi
 * /api/game/quiz/session/{pin}/next:
 *   post:
 *     tags: [Games - Quiz]
 *     summary: Advance to next question or complete quiz
 *     parameters:
 *       - in: path
 *         name: pin
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Advanced to next question or quiz completed
 *       403:
 *         description: Unauthorized
 */
router.post('/quiz/session/:pin/next', multiAuth, gameController.nextQuestion);

/**
 * @openapi
 * /api/game/quiz/session/{pin}/reveal:
 *   post:
 *     tags: [Games - Quiz]
 *     summary: Reveal answer and round results for current question
 *     parameters:
 *       - in: path
 *         name: pin
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Round results revealed
 *       403:
 *         description: Unauthorized
 */
router.post('/quiz/session/:pin/reveal', multiAuth, gameController.revealAnswer);

/**
 * @openapi
 * /api/game/quiz/session/{pin}/end:
 *   post:
 *     tags: [Games - Quiz]
 *     summary: End quiz session manually
 *     parameters:
 *       - in: path
 *         name: pin
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz session finished
 *       403:
 *         description: Unauthorized
 */
router.post('/quiz/session/:pin/end', multiAuth, gameController.endSession);

module.exports = router;

