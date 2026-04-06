const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       required:
 *         - event
 *         - startTime
 *         - endTime
 *         - title
 *       properties:
 *         id:
 *           type: string
 *         event:
 *           type: string
 *           description: ID of the event
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         title:
 *           type: string
 *         type:
 *           type: string
 *           description: e.g. Break, Keynote, Workshop, Activity, Networking
 *         description:
 *           type: string
 *         speakers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               role: { type: string }
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const ScheduleSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String }, // e.g., Break, Keynote, Workshop, Activity, Networking
  description: { type: String },
  speakers: [{
    name: String,
    role: String
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
