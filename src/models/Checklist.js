const mongoose = require('mongoose');

const ChecklistSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String, // e.g., Setup, Marketing, Engagement, Logistics
  },
  status: {
    type: String,
    enum: ['Done', 'Incomplete'],
    default: 'Incomplete',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Checklist', ChecklistSchema);
