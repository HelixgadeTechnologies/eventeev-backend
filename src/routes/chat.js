const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

/**
 * @openapi
 * /api/chat/room:
 *   post:
 *     tags: [Chat]
 *     summary: Create a new chat room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event, name]
 *             properties:
 *               event: { type: string }
 *               name: { type: string }
 *               type: { type: string, enum: [public, private] }
 *     responses:
 *       201:
 *         description: Room created
 */
router.post('/room', auth, chatController.createRoom);

/**
 * @openapi
 * /api/chat/rooms/{eventId}:
 *   get:
 *     tags: [Chat]
 *     summary: Get all rooms for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/rooms/:eventId', chatController.getRooms);

/**
 * @openapi
 * /api/chat/messages/{roomId}:
 *   get:
 *     tags: [Chat]
 *     summary: Get message history for a room
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/messages/:roomId', chatController.getMessages);

module.exports = router;
