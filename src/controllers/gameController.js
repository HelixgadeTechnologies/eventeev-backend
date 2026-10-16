const { GameSetting, GameWinner, Quiz, QuizSession } = require('../models/Game');
const User = require('../models/User');
const Event = require('../models/Event');


// ... (Previous Rolling Game logic) ...

/**
 * @desc    Create a new quiz
 * @route   POST /api/game/quiz/create
 * @access  Private
 */
exports.createQuiz = async (req, res) => {
  try {
    const { eventId } = req.body;
    // Check ownership
    const event = await Event.findById(eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to create quizzes for this event' });
    }

    const quiz = new Quiz(req.body);

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all template/featured quizzes for event organizers
 * @route   GET /api/game/quiz/templates
 * @access  Public / Authenticated
 */
exports.getTemplateQuizzes = async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    const filter = {
      $or: [
        { isTemplate: true },
        { eventId: null }
      ]
    };

    if (category && category.toLowerCase() !== 'all') {
      filter.category = new RegExp('^' + category + '$', 'i');
    }

    if (search) {
      filter.title = new RegExp(search, 'i');
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching template quizzes:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Clone a template quiz into an event-specific quiz
 * @route   POST /api/game/quiz/:id/clone
 * @access  Private
 */
exports.cloneQuiz = async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required to clone a quiz' });
    }

    const templateQuiz = await Quiz.findById(req.params.id);
    if (!templateQuiz) {
      return res.status(404).json({ message: 'Template quiz not found' });
    }

    // Verify event ownership
    const event = await Event.findById(eventId);
    if (!event || (event.owner && req.user && event.owner.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'User not authorized for this event' });
    }

    const clonedQuiz = new Quiz({
      eventId,
      title: req.body.title || templateQuiz.title,
      description: req.body.description || templateQuiz.description,
      category: templateQuiz.category,
      thumbnail: templateQuiz.thumbnail,
      author: (req.user && req.user.name) || event.organizer || 'Event Organizer',
      questions: templateQuiz.questions,
      isTemplate: false,
      isFeatured: false,
    });

    await clonedQuiz.save();
    res.status(201).json(clonedQuiz);
  } catch (error) {
    console.error('Error cloning quiz:', error);
    res.status(500).json({ message: 'Server Error' });
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

    // Check ownership only if this is a private event-specific quiz
    if (!quiz.isTemplate && quiz.eventId) {
      const event = await Event.findById(quiz.eventId);
      if (event && event.owner && req.user && event.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'User not authorized to access this quiz' });
      }
    }

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
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Check ownership only if this is a private event-specific quiz
    if (!quiz.isTemplate && quiz.eventId) {
      const event = await Event.findById(quiz.eventId);
      if (event && event.owner && req.user && event.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'User not authorized to host this quiz' });
      }
    }

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
 * Calculate Kahoot-style points based on accuracy, response time, and streak.
 * - Incorrect answer or expired time: 0 points, streak resets.
 * - Correct answer within time limit: Awards between 50% and 100% of maxPoints using linear decay:
 *     BasePoints = round((1 - (timeTaken / (2 * timeLimit))) * maxPoints)
 * - Streak bonus:
 *     Streak 2: +100
 *     Streak 3: +200
 *     Streak 4: +300
 *     Streak >= 5: +500
 */
const calculateKahootScore = (isCorrect, timeTaken, timeLimit, maxPoints = 1000, currentStreak = 0) => {
  if (!isCorrect) {
    return { basePoints: 0, streakBonus: 0, totalPoints: 0, newStreak: 0 };
  }

  const limit = timeLimit > 0 ? timeLimit : 20;
  const t = typeof timeTaken === 'number' ? timeTaken : parseFloat(timeTaken) || 0;

  // If time exceeds question limit (with 0.5s network latency grace window)
  if (t > limit + 0.5) {
    return { basePoints: 0, streakBonus: 0, totalPoints: 0, newStreak: 0 };
  }

  // Clamped time between 0 and limit
  const clampedTime = Math.max(0, Math.min(t, limit));

  // Kahoot speed formula: (1 - ((response_time / question_timer) / 2)) * max_points
  const speedRatio = clampedTime / (2 * limit);
  const basePoints = Math.round((1 - speedRatio) * maxPoints);

  // Streak bonus calculation
  const newStreak = (currentStreak || 0) + 1;
  let streakBonus = 0;
  if (newStreak === 2) streakBonus = 100;
  else if (newStreak === 3) streakBonus = 200;
  else if (newStreak === 4) streakBonus = 300;
  else if (newStreak >= 5) streakBonus = 500;

  return {
    basePoints,
    streakBonus,
    totalPoints: basePoints + streakBonus,
    newStreak,
  };
};

/**
 * @desc    Submit answer (Kahoot-style speed & accuracy scoring)
 * @route   PATCH /api/game/quiz/session/:pin/submit
 * @access  Public
 */
exports.submitAnswer = async (req, res) => {
  const { pin } = req.params;
  const { userId, nickname, questionIndex, answerIndex, answer, timeTaken } = req.body;

  try {
    const session = await QuizSession.findOne({ pin }).populate('quizId');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const quiz = session.quizId;
    if (!quiz || !quiz.questions || !quiz.questions[questionIndex]) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    const question = quiz.questions[questionIndex];

    // Find participant by userId, subdocument _id, or nickname
    const participant = session.participants.find(p => {
      if (userId && p.userId && p.userId.toString() === userId.toString()) return true;
      if (userId && p._id && p._id.toString() === userId.toString()) return true;
      if (nickname && p.nickname && p.nickname.toLowerCase() === nickname.toLowerCase()) return true;
      return false;
    });

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found in this session' });
    }

    // Initialize answers array if missing
    if (!participant.answers) {
      participant.answers = [];
    }

    // Guard against multiple submissions for the same question
    const alreadyAnswered = participant.answers.some(a => a.questionIndex === Number(questionIndex));
    if (alreadyAnswered) {
      return res.status(400).json({ message: 'You have already submitted an answer for this question' });
    }

    // Normalize submitted answers to an array of numbers
    let submittedAnswers = [];
    if (Array.isArray(answer)) {
      submittedAnswers = answer.map(Number);
    } else if (answer !== undefined && answer !== null) {
      submittedAnswers = [Number(answer)];
    } else if (answerIndex !== undefined && answerIndex !== null) {
      submittedAnswers = [Number(answerIndex)];
    }

    // Check correctness
    const correctAnswers = (question.correctAnswer || []).map(Number);
    let isCorrect = false;

    if (question.isMultiSelect) {
      // Must match all correct indices with no extraneous choices
      isCorrect =
        submittedAnswers.length === correctAnswers.length &&
        submittedAnswers.every(ans => correctAnswers.includes(ans));
    } else {
      // Single choice
      isCorrect =
        submittedAnswers.length === 1 &&
        correctAnswers.includes(submittedAnswers[0]);
    }

    // Calculate Kahoot points
    const maxPoints = question.points || 1000;
    const { basePoints, streakBonus, totalPoints, newStreak } = calculateKahootScore(
      isCorrect,
      timeTaken,
      question.timeLimit || 20,
      maxPoints,
      participant.streak || 0
    );

    // Update participant stats
    participant.score = (participant.score || 0) + totalPoints;
    participant.streak = newStreak;
    participant.lastAnswerCorrect = isCorrect;
    participant.answers.push({
      questionIndex: Number(questionIndex),
      answer: submittedAnswers,
      timeTaken: Number(timeTaken) || 0,
      isCorrect,
      basePoints,
      streakBonus,
      totalPoints,
      answeredAt: new Date(),
    });

    await session.save();

    // Broadcast updated leaderboard to Socket.IO room if available
    try {
      const { getIO } = require('../utils/socket');
      const io = getIO();
      io.to(`quiz_${pin}`).emit('quiz_leaderboard_updated', {
        pin,
        leaderboard: session.participants
          .map(p => ({
            userId: p.userId,
            nickname: p.nickname,
            score: p.score,
            streak: p.streak,
            lastAnswerCorrect: p.lastAnswerCorrect,
          }))
          .sort((a, b) => (b.score || 0) - (a.score || 0)),
      });
    } catch (socketErr) {
      // Socket instance might not be initialized in non-server contexts (e.g. unit tests)
    }

    res.json({
      isCorrect,
      points: totalPoints,
      basePoints,
      streakBonus,
      streak: participant.streak,
      currentScore: participant.score,
    });
  } catch (error) {
    console.error('Error submitting quiz answer:', error);
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

    const sortedParticipants = session.participants.sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );
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
    // Check ownership
    const event = await Event.findById(req.params.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to access these settings' });
    }

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
    // Check ownership
    const event = await Event.findById(req.params.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update these settings' });
    }

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
    // Check ownership
    const event = await Event.findById(req.params.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to access participants' });
    }

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
    // Check ownership
    const event = await Event.findById(req.params.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to record winners' });
    }

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
    // Check ownership
    const event = await Event.findById(req.params.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to view winners' });
    }

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
    // Check ownership
    const event = await Event.findById(req.params.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to reset game history' });
    }

    await GameWinner.deleteMany({ eventId: req.params.eventId, gameType: 'rolling' });

    res.json({ message: 'Game history reset' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
