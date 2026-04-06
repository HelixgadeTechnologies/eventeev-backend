const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Speaker:
 *       type: object
 *       required:
 *         - eventId
 *         - firstName
 *         - lastName
 *       properties:
 *         id:
 *           type: string
 *         eventId:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         title:
 *           type: string
 *         company:
 *           type: string
 *         bio:
 *           type: string
 *         topic:
 *           type: string
 *         photo:
 *           type: string
 *         socialLinks:
 *           type: object
 *           properties:
 *             twitter: { type: string }
 *             companyTwitter: { type: string }
 *         sessions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               sessionId: { type: string }
 *               title: { type: string }
 *               date: { type: string, format: date-time }
 *               time: { type: string }
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const SpeakerSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  company: {
    type: String,
  },
  bio: {
    type: String,
  },
  topic: {
    type: String,
  },
  photo: {
    type: String,
  },
  socialLinks: {
    twitter: String,
    companyTwitter: String,
  },
  sessions: [
    {
      sessionId: String,
      title: String,
      date: Date,
      time: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Speaker', SpeakerSchema);
