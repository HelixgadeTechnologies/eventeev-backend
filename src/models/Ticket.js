const mongoose = require('mongoose');

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
