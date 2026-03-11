const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// @route   POST /api/chat/room
router.post('/room', auth, chatController.createRoom);

// @route   GET /api/chat/rooms/:eventId
router.get('/rooms/:eventId', chatController.getRooms);

// @route   GET /api/chat/messages/:roomId
router.get('/messages/:roomId', chatController.getMessages);

module.exports = router;
