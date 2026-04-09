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
 *           enum: [virtual, hybrid, in person]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         location:
 *           type: string
 *         bannerImage:
 *           type: string
 *         thumbnailImage:
 *           type: string
 *         website:
 *           type: string
 *         facebookUrl:
 *           type: string
 *         instagramUrl:
 *           type: string
 *         xUrl:
 *           type: string
 *         recurrentEvent:
 *           type: boolean
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
 *         type: physical
 *         startDate: 2026-05-15T10:00:00Z
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
    enum: ['virtual', 'hybrid', 'in person'],
    required: [true, 'Please add an event type'],
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
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
    required: [true, 'Please add a location'],
  },
  bannerImage: {
    type: String,
  },
  thumbnailImage: {
    type: String,
  },
  website: {
    type: String,
  },
  facebookUrl: {
    type: String,
  },
  instagramUrl: {
    type: String,
  },
  xUrl: {
    type: String,
  },
  recurrentEvent: {
    type: Boolean,
    default: false,
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
