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
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a schedule title'],
  },
  type: {
    type: String,
  },
  date: {
    type: Date,
  },
  startTime: {
    type: String,
    required: [true, 'Please add a start time'],
  },
  order: {
    type: Number,
    default: 0,
  },
  endTime: {
    type: String,
    required: [true, 'Please add an end time'],
  },
  description: {
    type: String,
  },
  speakers: [{
    name: String,
    role: String,
  }],
  speakerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Speaker',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
