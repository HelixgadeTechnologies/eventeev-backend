const { GameSetting, GameWinner, Quiz, QuizSession } = require('../models/Game');
const User = require('../models/User');

// ... (Previous Rolling Game logic) ...

/**
 * @desc    Create a new quiz
 * @route   POST /api/game/quiz/create
 * @access  Private
 */
exports.createQuiz = async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get quiz by id
 * @route   GET /api/game/quiz/:id
 * @access  Public
 */
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Host a quiz session (generate PIN)
 * @route   POST /api/game/quiz/:id/session
 * @access  Private
 */
exports.hostQuiz = async (req, res) => {
  try {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const session = new QuizSession({
      quizId: req.params.id,
      hostId: req.user.id, // Assuming auth middleware provides req.user
      pin,
    });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Join a quiz session
 * @route   POST /api/game/quiz/session/join
 * @access  Public
 */
exports.joinSession = async (req, res) => {
  const { pin, nickname, userId } = req.body;
  try {
    const session = await QuizSession.findOne({ pin, status: 'waiting' });
    if (!session) return res.status(404).json({ message: 'Session not found or already started' });
    
    session.participants.push({ userId, nickname });
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Submit answer
 * @route   PATCH /api/game/quiz/session/:pin/submit
 * @access  Private
 */
exports.submitAnswer = async (req, res) => {
  const { pin } = req.params;
  const { userId, questionIndex, answerIndex, timeTaken } = req.body;
  try {
    const session = await QuizSession.findOne({ pin }).populate('quizId');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const quiz = session.quizId;
    const question = quiz.questions[questionIndex];
    const isCorrect = question.correctAnswer.includes(answerIndex);

    // Scoring logic (simplified)
    const points = isCorrect ? Math.round(question.points * (1 - timeTaken / question.timeLimit)) : 0;

    const participant = session.participants.find(p => p.userId.toString() === userId);
    if (participant) {
      participant.score += points;
      participant.streak = isCorrect ? participant.streak + 1 : 0;
      participant.lastAnswerCorrect = isCorrect;
    }

    await session.save();
    res.json({ isCorrect, points, currentScore: participant?.score });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get leaderboard
 * @route   GET /api/game/quiz/session/:pin/leaderboard
 * @access  Public
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const session = await QuizSession.findOne({ pin: req.params.pin });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const sortedParticipants = session.participants.sort((a, b) => b.score - a.score);
    res.json(sortedParticipants);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get rolling game settings for an event
 * @route   GET /api/game/:eventId/rolling/settings
 * @access  Public
 */
exports.getRollingSettings = async (req, res) => {
  try {
    let settings = await GameSetting.findOne({ eventId: req.params.eventId, gameType: 'rolling' });
    if (!settings) {
      // Create default settings if none exist
      settings = new GameSetting({ eventId: req.params.eventId });
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update rolling game settings
 * @route   PATCH /api/game/:eventId/rolling/settings
 * @access  Private
 */
exports.updateRollingSettings = async (req, res) => {
  try {
    const settings = await GameSetting.findOneAndUpdate(
      { eventId: req.params.eventId, gameType: 'rolling' },
      req.body,
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get eligible participants for the rolling game
 * @route   GET /api/game/:eventId/rolling/participants
 * @access  Private
 */
exports.getRollingParticipants = async (req, res) => {
  try {
    const settings = await GameSetting.findOne({ eventId: req.params.eventId, gameType: 'rolling' });
    const filter = settings?.participantFilter || 'checked-in';

    // Mocking logic for attendee filtering
    // In a real app, you'd check a 'Registration' or 'Attendee' model for 'checked-in' status
    const query = {}; // Add logic to filter by eventId and check-in status
    const participants = await User.find(query).select('firstName lastName email avatar');
    
    res.json(participants);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Record a new winner
 * @route   POST /api/game/:eventId/rolling/winner
 * @access  Private
 */
exports.recordWinner = async (req, res) => {
  const { userId, prizeWon } = req.body;
  try {
    const winner = new GameWinner({
      eventId: req.params.eventId,
      userId,
      prizeWon
    });
    await winner.save();
    res.status(201).json(winner);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get winners for a rolling game
 * @route   GET /api/game/:eventId/rolling/winners
 * @access  Public
 */
exports.getWinners = async (req, res) => {
  try {
    const winners = await GameWinner.find({ eventId: req.params.eventId, gameType: 'rolling' })
      .populate('userId', 'firstName lastName email avatar')
      .sort({ rolledAt: -1 });
    res.json(winners);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Reset game winners
 * @route   POST /api/game/:eventId/rolling/reset
 * @access  Private
 */
exports.resetGame = async (req, res) => {
  try {
    await GameWinner.deleteMany({ eventId: req.params.eventId, gameType: 'rolling' });
    res.json({ message: 'Game history reset' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
