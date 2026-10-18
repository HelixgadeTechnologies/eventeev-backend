const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const multiAuth = require('../middleware/multiAuth');

/**
 * @openapi
 * /api/chat/room:
 *   post:
 *     tags: [Chat]
 *     summary: Create a new chat room or get existing direct room
 *     security:
 *       - bearerAuth: []
 */
router.post('/room', multiAuth, chatController.createRoom);
router.post('/rooms', multiAuth, chatController.createRoom);

/**
 * @openapi
 * /api/chat/rooms/{eventId}:
 *   get:
 *     tags: [Chat]
 *     summary: Get all accessible rooms for an event
 */
router.get('/rooms/:eventId', multiAuth, chatController.getRooms);

/**
 * @openapi
 * /api/chat/messages/{roomId}:
 *   get:
 *     tags: [Chat]
 *     summary: Get message history for a room
 */
router.get('/messages/:roomId', multiAuth, chatController.getMessages);

/**
 * @openapi
 * /api/chat/messages/{roomId}:
 *   post:
 *     tags: [Chat]
 *     summary: Send a message to a room
 */
router.post('/messages/:roomId', multiAuth, chatController.sendMessage);

module.exports = router;
