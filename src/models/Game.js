const mongoose = require('mongoose');

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
