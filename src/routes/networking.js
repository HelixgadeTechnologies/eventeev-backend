const express = require('express');
const router = express.Router();
const networkingController = require('../controllers/networkingController');
const attendeeAuth = require('../middleware/attendeeAuth');
const multiAuth = require('../middleware/multiAuth');

/**
 * @openapi
 * /api/networking/attendees/{eventId}:
 *   get:
 *     tags: [Networking]
 *     summary: Get attendees for networking
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/attendees/:eventId', multiAuth, networkingController.getNetworkingAttendees);

/**
 * @openapi
 * /api/networking/connections/{eventId}:
 *   get:
 *     tags: [Networking]
 *     summary: Get my connections for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/connections/:eventId', attendeeAuth, networkingController.getMyConnections);

/**
 * @openapi
 * /api/networking/connect:
 *   post:
 *     tags: [Networking]
 *     summary: Send a connection request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId, eventId]
 *             properties:
 *               recipientId: { type: string }
 *               eventId: { type: string }
 *     responses:
 *       201:
 *         description: Request sent
 */
router.post('/connect', attendeeAuth, networkingController.sendConnectionRequest);

/**
 * @openapi
 * /api/networking/connect/{id}:
 *   patch:
 *     tags: [Networking]
 *     summary: Update connection status (accept/reject)
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
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [accepted, rejected] }
 *     responses:
 *       200:
 *         description: Connection updated
 */
router.patch('/connect/:id', attendeeAuth, networkingController.updateConnection);

module.exports = router;
