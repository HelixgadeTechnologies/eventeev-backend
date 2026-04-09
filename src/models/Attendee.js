const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Attendee:
 *       type: object
 *       required:
 *         - eventId
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *         eventId:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         orderId:
 *           type: string
 *         isCheckedIn:
 *           type: boolean
 *         checkInTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, verified, cancelled]
 *         registrationDate:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 60d21b4667d0d8992e610c90
 *         eventId: 60d21b4667d0d8992e610c8a
 *         name: Alice Smith
 *         email: alice@example.com
 *         isCheckedIn: false
 *         status: pending
 */
const AttendeeSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
  },
  orderId: {
    type: String,
    unique: true,
  },
  isCheckedIn: {
    type: Boolean,
    default: false,
  },
  checkInTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'cancelled'],
    default: 'pending',
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Attendee', AttendeeSchema);
