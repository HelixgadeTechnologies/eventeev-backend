const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  type: {
    type: String,
    enum: ['free', 'paid', 'donation'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
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
    required: true,
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
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Ticket', TicketSchema);
