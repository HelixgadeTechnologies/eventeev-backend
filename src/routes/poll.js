const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

/**
 * @openapi
 * /api/poll/event/{eventId}:
 *   get:
 *     tags: [Polls]
 *     summary: Get all polls for an event
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
 *                 $ref: '#/components/schemas/Poll'
 */
router.get('/event/:eventId', pollController.getPollsByEvent);

/**
 * @openapi
 * /api/poll/create:
 *   post:
 *     tags: [Polls]
 *     summary: Create a new poll
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Poll'
 *     responses:
 *       201:
 *         description: Poll created
 */
router.post('/create', auth, pollController.createPoll);

/**
 * @openapi
 * /api/poll/{id}:
 *   get:
 *     tags: [Polls]
 *     summary: Get poll results by ID
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
 *               $ref: '#/components/schemas/Poll'
 */
router.get('/:id', pollController.getPollResults);

/**
 * @openapi
 * /api/poll/{id}/status:
 *   patch:
 *     tags: [Polls]
 *     summary: Update poll status (LIVE/ENDED)
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               status: { type: string, enum: [LIVE, ENDED] }
 *     responses:
 *       200:
 *         description: Poll status updated
 */
router.patch('/:id/status', auth, pollController.updatePollStatus);

/**
 * @openapi
 * /api/poll/{id}/vote:
 *   post:
 *     tags: [Polls]
 *     summary: Submit a vote to a poll
 *     security:
 *       - bearerAuth: []
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
 *             required: [questionId, optionId]
 *             properties:
 *               questionId: { type: string }
 *               optionId: { type: string }
 *     responses:
 *       200:
 *         description: Vote submitted
 */
router.post('/:id/vote', auth, pollController.submitVote);

/**
 * @openapi
 * /api/poll/{id}:
 *   delete:
 *     tags: [Polls]
 *     summary: Delete a poll
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Poll deleted
 */
router.delete('/:id', auth, pollController.deletePoll);

module.exports = router;
