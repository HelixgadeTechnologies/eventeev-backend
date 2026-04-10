const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - recipient
 *         - title
 *         - message
 *       properties:
 *         id:
 *           type: string
 *         recipient:
 *           type: string
 *           description: ID of the user receiving the notification
 *         sender:
 *           type: string
 *           description: ID of the user (or system) who triggered the notification
 *         type:
 *           type: string
 *           enum: [info, success, warning, error, message, event, ticket]
 *           default: info
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         link:
 *           type: string
 *           description: Navigation link for the frontend
 *         isRead:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'message', 'event', 'ticket'],
    default: 'info',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', NotificationSchema);
