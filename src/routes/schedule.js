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
 *             $ref: '#/components/schemas/Schedule'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
router.get('/event/:eventId', scheduleController.getEventSchedule);
/**
 * @openapi
 * /api/schedule/{id}:
 *   put:
 *     tags: [Schedule]
 *     summary: Update a schedule item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Schedule item updated
 *   delete:
 *     tags: [Schedule]
 *     summary: Delete a schedule item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Schedule item removed
 */
router.put('/:id', auth, scheduleController.updateScheduleItem);
router.delete('/:id', auth, scheduleController.deleteScheduleItem);

module.exports = router;
