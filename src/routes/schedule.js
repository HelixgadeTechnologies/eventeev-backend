const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/auth');

/**
 * @openapi
 * /api/schedule:
 *   post:
 *     tags: [Schedule]
 *     summary: Create a new schedule item
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event, title, startTime, endTime]
 *             properties:
 *               event: { type: string }
 *               title: { type: string }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *               description: { type: string }
 *               speakers: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Schedule item created
 */
router.post('/', auth, scheduleController.createScheduleItem);

/**
 * @openapi
 * /api/schedule/event/{eventId}:
 *   get:
 *     tags: [Schedule]
 *     summary: Get schedule for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/event/:eventId', scheduleController.getEventSchedule);

module.exports = router;
