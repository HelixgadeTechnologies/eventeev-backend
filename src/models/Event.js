const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         type:
 *           type: string
 *           enum: [Online, Physical]
 *         date:
 *           type: string
 *           format: date-time
 *         time:
 *           type: string
 *         location:
 *           type: string
 *         bannerImage:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Draft, Published, Completed]
 *         owner:
 *           type: string
 *           description: ID of the user who owns the event
 *       example:
 *         id: 60d21b4667d0d8992e610c8a
 *         title: Annual Tech Summit 2026
 *         description: A large-scale event for technology enthusiasts
 *         category: Conference
 *         type: Physical
 *         date: 2026-05-15T10:00:00Z
 *         status: Published
 */
const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  type: {
    type: String,
    enum: ['Online', 'Physical'],
    required: [true, 'Please add an event type'],
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
  },
  time: {
    type: String,
    required: [true, 'Please add a time'],
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
  },
  bannerImage: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Completed'],
    default: 'Draft',
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

module.exports = mongoose.model('Event', EventSchema);
