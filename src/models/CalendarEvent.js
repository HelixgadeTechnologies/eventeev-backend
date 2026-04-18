const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     CalendarEvent:
 *       type: object
 *       required:
 *         - title
 *         - startDate
 *         - startTime
 *         - category
 *         - type
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         location:
 *           type: string
 *         website:
 *           type: string
 *         category:
 *           type: string
 *         type:
 *           type: string
 *           enum: [virtual, hybrid, in person]
 *         owner:
 *           type: string
 */
const CalendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  endDate: {
    type: Date,
  },
  startTime: {
    type: String,
    required: [true, 'Please add a start time'],
  },
  endTime: {
    type: String,
  },
  location: {
    type: String,
    required: [true, 'Please add a location/venue'],
  },
  website: {
    type: String,
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  type: {
    type: String,
    enum: ['virtual', 'hybrid', 'in person'],
    default: 'in person',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);
