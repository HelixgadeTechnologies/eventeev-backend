const mongoose = require('mongoose');

const PollSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Pre-Event', 'Live Poll', 'Post-Event'],
    default: 'Live Poll',
  },
  status: {
    type: String,
    enum: ['LIVE', 'ENDED'],
    default: 'LIVE',
  },
  questions: [
    {
      text: {
        type: String,
        required: true,
      },
      options: [
        {
          text: String,
          votesCount: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
  ],
  totalResponses: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Poll', PollSchema);
