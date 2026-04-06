const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       required:
 *         - eventId
 *         - name
 *         - type
 *         - quantity
 *       properties:
 *         id:
 *           type: string
 *         eventId:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [Free, Paid, Donation]
 *         price:
 *           type: number
 *         suggestedAmount:
 *           type: number
 *         quantity:
 *           type: number
 *         startDate:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *         endDate:
 *           type: string
 *           format: date
 *         endTime:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Sold Out]
 *       example:
 *         id: 60d21b4667d0d8992e610c8c
 *         eventId: 60d21b4667d0d8992e610c8a
 *         name: Early Bird Ticket
 *         type: Paid
 *         price: 50.00
 *         quantity: 100
 *         status: Active
 */
const TicketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a ticket name'],
  },
  type: {
    type: String,
    enum: ['Free', 'Paid', 'Donation'],
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  suggestedAmount: {
    type: Number,
  },
  quantity: {
    type: Number,
    required: [true, 'Please add a quantity'],
  },
  startDate: {
    type: Date,
  },
  startTime: {
    type: String,
  },
  endDate: {
    type: Date,
  },
  endTime: {
    type: String,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Sold Out'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Ticket', TicketSchema);
