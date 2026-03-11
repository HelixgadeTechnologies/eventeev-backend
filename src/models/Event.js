const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    type: String,
  },
  type: {
    type: String,
    enum: ['Live', 'Hybrid', 'Virtual'],
    default: 'Live',
  },
  date: {
    type: Date,
  },
  time: {
    type: String,
  },
  location: {
    type: String,
  },
  bannerImage: {
    type: String,
  },
  socialLinks: {
    website: String,
    instagram: String,
    twitter: String,
    linkedin: String,
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Completed'],
    default: 'Draft',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Event', EventSchema);
