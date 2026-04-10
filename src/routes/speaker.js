const express = require('express');
const router = express.Router();
const speakerController = require('../controllers/speakerController');

/**
 * @openapi
 * /api/speaker/event/{eventId}:
 *   get:
 *     tags: [Speakers]
 *     summary: Get all speakers for an event
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
 *                 $ref: '#/components/schemas/Speaker'
 */
router.get('/event/:eventId', speakerController.getSpeakersByEvent);
router.get('/event/:eventId/stats', speakerController.getSpeakerStats);

/**
 * @openapi
 * /api/speaker/create:
 *   post:
 *     tags: [Speakers]
 *     summary: Create a new speaker
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Speaker'
 *     responses:
 *       201:
 *         description: Speaker created
 */
router.post('/create', speakerController.createSpeaker);

/**
 * @openapi
 * /api/speaker/{id}:
 *   get:
 *     tags: [Speakers]
 *     summary: Get speaker by ID
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
 *               $ref: '#/components/schemas/Speaker'
 */
router.get('/:id', speakerController.getSpeaker);

/**
 * @openapi
 * /api/speaker/edit/{id}:
 *   put:
 *     tags: [Speakers]
 *     summary: Update speaker details
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
 *             $ref: '#/components/schemas/Speaker'
 *     responses:
 *       200:
 *         description: Speaker updated
 */
router.put('/edit/:id', speakerController.updateSpeaker);

/**
 * @openapi
 * /api/speaker/{id}:
 *   delete:
 *     tags: [Speakers]
 *     summary: Delete a speaker
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Speaker deleted
 */
router.delete('/:id', speakerController.deleteSpeaker);

/**
 * @openapi
 * /api/speaker/{id}/sessions:
 *   post:
 *     tags: [Speakers]
 *     summary: Manage speaker sessions
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
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 sessionId: { type: string }
 *                 title: { type: string }
 *     responses:
 *       200:
 *         description: Sessions updated
 */
router.post('/:id/sessions', speakerController.manageSessions);

module.exports = router;
