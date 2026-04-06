const mongoose = require('mongoose');

const AttendeeSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
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
