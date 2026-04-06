const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - room
 *         - sender
 *         - content
 *       properties:
 *         id:
 *           type: string
 *         room:
 *           type: string
 *           description: ID of the room
 *         sender:
 *           type: string
 *           description: ID of the sender
 *         content:
 *           type: string
 *         type:
 *           type: string
 *           enum: [user_message, system_message]
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const MessageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['user_message', 'system_message'],
    default: 'user_message',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', MessageSchema);
