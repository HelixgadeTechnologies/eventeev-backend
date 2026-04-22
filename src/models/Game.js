const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     GameSetting:
 *       type: object
 *       required:
 *         - eventId
 *       properties:
 *         id:
 *           type: string
 *         eventId:
 *           type: string
 *         gameType:
 *           type: string
 *           enum: [rolling]
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         prizes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               prizeName: { type: string }
 *               quantity: { type: number }
 *         allowRepeatWinners:
 *           type: boolean
 *         participantFilter:
 *           type: string
 *           enum: [all, checked-in]
 *     GameWinner:
 *       type: object
 *       required:
 *         - eventId
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *         eventId:
 *           type: string
 *         userId:
 *           type: string
 *         prizeWon:
 *           type: string
 *         rolledAt:
 *           type: string
 *           format: date-time
 *     Quiz:
 *       type: object
 *       required:
 *         - eventId
 *         - title
 *       properties:
 *         id:
 *           type: string
 *         eventId:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         questions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               text: { type: string }
 *               mediaUrl: { type: string }
 *               type: { type: string, enum: [Quiz, True/False] }
 *               options: { type: array, items: { type: string } }
 *               correctAnswer: { type: array, items: { type: number } }
 *               timeLimit: { type: number }
 *               points: { type: number }
 *               isMultiSelect: { type: boolean }
 *     QuizSession:
 *       type: object
 *       required:
 *         - quizId
 *         - hostId
 *         - pin
 *       properties:
 *         id:
 *           type: string
 *         quizId:
 *           type: string
 *         hostId:
 *           type: string
 *         pin:
 *           type: string
 *         status:
 *           type: string
 *           enum: [waiting, active, finished]
 *         currentQuestionIndex:
 *           type: number
 *         participants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               nickname: { type: string }
 *               score: { type: number }
 *               streak: { type: number }
 */

const GameSettingSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  gameType: {
    type: String,
    enum: ['rolling'],
    default: 'rolling',
  },
  title: {
    type: String,
    default: 'The Lucky Roll',
  },
  description: {
    type: String,
  },
  prizes: [
    {
      prizeName: String,
      quantity: Number,
    },
  ],
  allowRepeatWinners: {
    type: Boolean,
    default: false,
  },
  participantFilter: {
    type: String,
    enum: ['all', 'checked-in'],
    default: 'checked-in',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const GameWinnerSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  gameType: {
    type: String,
    default: 'rolling',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  prizeWon: {
    type: String,
  },
  rolledAt: {
    type: Date,
    default: Date.now,
  },
});

const QuizSchema = new mongoose.Schema({
  eventId: {
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
    type: String,
  },
  questions: [
    {
      text: String,
      mediaUrl: String,
      type: { type: String, enum: ['Quiz', 'True/False'], default: 'Quiz' },
      options: [String],
      correctAnswer: [Number], // Indices
      timeLimit: { type: Number, default: 20 },
      points: { type: Number, default: 5 },
      isMultiSelect: { type: Boolean, default: false },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const QuizSessionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pin: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting',
  },
  currentQuestionIndex: {
    type: Number,
    default: 0,
  },
  participants: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nickname: String,
      score: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      lastAnswerCorrect: { type: Boolean, default: false },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const GameSetting = mongoose.model('GameSetting', GameSettingSchema);
const GameWinner = mongoose.model('GameWinner', GameWinnerSchema);
const Quiz = mongoose.model('Quiz', QuizSchema);
const QuizSession = mongoose.model('QuizSession', QuizSessionSchema);

module.exports = { GameSetting, GameWinner, Quiz, QuizSession };
