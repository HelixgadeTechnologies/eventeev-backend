const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  votedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only vote once per question in a poll
VoteSchema.index({ userId: 1, pollId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
