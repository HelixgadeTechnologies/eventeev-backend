const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Vote:
 *       type: object
 *       required:
 *         - userId
 *         - pollId
 *         - questionId
 *         - optionId
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         pollId:
 *           type: string
 *         questionId:
 *           type: string
 *         optionId:
 *           type: string
 *         votedAt:
 *           type: string
 *           format: date-time
 */
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
