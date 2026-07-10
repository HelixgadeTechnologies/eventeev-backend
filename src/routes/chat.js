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
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       201:
 *         description: Room created
 */
router.post('/room', auth, chatController.createRoom);

const multiAuth = require('../middleware/multiAuth');

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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
router.get('/rooms/:eventId', multiAuth, chatController.getRooms);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 */
router.get('/messages/:roomId', multiAuth, chatController.getMessages);

/**
 * @openapi
 * /api/chat/messages/{roomId}:
 *   post:
 *     tags: [Chat]
 *     summary: Send a message to a room
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/messages/:roomId', multiAuth, chatController.sendMessage);

module.exports = router;

