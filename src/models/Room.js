const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       required:
 *         - event
 *         - name
 *       properties:
 *         id:
 *           type: string
 *         event:
 *           type: string
 *           description: ID of the event
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [public, private]
 *         leadParticipant:
 *           type: string
 *           description: ID of the lead user
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const RoomSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  leadParticipant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Room', RoomSchema);
