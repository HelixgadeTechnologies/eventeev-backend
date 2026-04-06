const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Link:
 *       type: object
 *       required:
 *         - eventId
 *         - title
 *         - url
 *       properties:
 *         id:
 *           type: string
 *         eventId:
 *           type: string
 *         title:
 *           type: string
 *         url:
 *           type: string
 *           format: uri
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const LinkSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['document', 'video', 'link'],
    default: 'link',
  },
  description: {
    type: String,
  },
  addedBy: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Link', LinkSchema);
