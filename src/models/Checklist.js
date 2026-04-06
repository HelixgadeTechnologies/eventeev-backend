const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Checklist:
 *       type: object
 *       required:
 *         - event
 *         - title
 *       properties:
 *         id:
 *           type: string
 *         event:
 *           type: string
 *           description: ID of the event
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Done, Incomplete]
 *       example:
 *         id: 60d21b4667d0d8992e610c95
 *         event: 60d21b4667d0d8992e610c8a
 *         title: Book Venue
 *         category: Logistics
 *         status: Incomplete
 */
const ChecklistSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String, // e.g., Setup, Marketing, Engagement, Logistics
  },
  status: {
    type: String,
    enum: ['Done', 'Incomplete'],
    default: 'Incomplete',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Checklist', ChecklistSchema);
