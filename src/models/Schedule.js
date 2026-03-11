const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String }, // e.g., Break, Keynote, Workshop, Activity, Networking
  description: { type: String },
  speakers: [{
    name: String,
    role: String
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
