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
 *           enum: [public, private, general, announcement]
 *         isGroup:
 *           type: boolean
 *           default: true
 *         participantIds:
 *           type: array
 *           items:
 *             type: string
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
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['public', 'private', 'general', 'announcement'],
    default: 'public',
  },
  isGroup: {
    type: Boolean,
    default: true,
    index: true,
  },
  participantIds: [{
    type: String,
    index: true,
  }],
  participants: [{
    id: String,
    modelType: {
      type: String,
      enum: ['User', 'Attendee'],
      default: 'Attendee',
    },
    name: String,
    avatar: String,
    role: {
      type: String,
      enum: ['admin', 'attendee'],
      default: 'attendee',
    },
  }],
  leadParticipant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast participant matching
RoomSchema.index({ event: 1, isGroup: 1, participantIds: 1 });

module.exports = mongoose.model('Room', RoomSchema);
