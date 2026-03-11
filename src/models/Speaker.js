const mongoose = require('mongoose');

const SpeakerSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  company: {
    type: String,
  },
  bio: {
    type: String,
  },
  topic: {
    type: String,
  },
  photo: {
    type: String,
  },
  socialLinks: {
    twitter: String,
    companyTwitter: String,
  },
  sessions: [
    {
      sessionId: String,
      title: String,
      date: Date,
      time: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Speaker', SpeakerSchema);
