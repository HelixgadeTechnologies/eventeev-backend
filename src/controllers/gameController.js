const mongoose = require('mongoose');
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
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'A valid eventId is required' });
    }

    // Check ownership
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.owner && req.user && event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to create quizzes for this event' });
    }

    // Resolve author name and avatar from creator profile
    const User = require('../models/User');
    let authorName = req.body.author;
    let authorAvatar = req.body.authorAvatar;
    if (req.user) {
      const u = await User.findById(req.user.id).select('firstName lastName name orgName avatar email');
      if (u) {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.orgName || u.email;
        if (!authorName || authorName === 'Eventeev Staff' || authorName === 'Organizer') {
          authorName = fullName;
        }
        if (!authorAvatar && u.avatar) {
          authorAvatar = u.avatar;
        }
      }
    }

    const quizTargetId = req.body.id || req.body._id;
    if (quizTargetId && mongoose.Types.ObjectId.isValid(quizTargetId)) {
      const existing = await Quiz.findById(quizTargetId);
      if (existing) {
        existing.title = req.body.title || existing.title;
        existing.description = req.body.description !== undefined ? req.body.description : existing.description;
        existing.category = req.body.category || existing.category;
        existing.thumbnail = req.body.thumbnail || existing.thumbnail;
        existing.questions = req.body.questions || existing.questions;
        if (authorName && authorName !== 'Eventeev Staff') {
          existing.author = authorName;
        }
        if (authorAvatar) {
          existing.authorAvatar = authorAvatar;
        }
        if (req.user) {
          existing.createdBy = req.user.id;
        }
        await existing.save();
        return res.json(existing);
      }
    }

    const quiz = new Quiz({
      ...req.body,
      createdBy: req.user ? req.user.id : undefined,
      author: authorName || (event && event.organizer) || "Organizer",
      authorAvatar: authorAvatar || undefined
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

/**
 * @desc    Get all template/featured quizzes for event organizers
 * @route   GET /api/game/quiz/templates
 * @access  Public / Authenticated
 */
/**
 * @desc    Get all quizzes for an event
 * @route   GET /api/game/quiz/event/:eventId
 * @access  Public / Authenticated
 */
exports.getQuizzesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "A valid eventId is required" });
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    const quizzes = await Quiz.find({
      $or: [
        { eventId: eventId },
        { eventId: eventObjectId }
      ]
    }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error("Error fetching event quizzes:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

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
    const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'firstName lastName name avatar orgName email');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let event = null;
    // Check ownership only if this is a private event-specific quiz
    if (!quiz.isTemplate && quiz.eventId) {
      event = await Event.findById(quiz.eventId).populate('owner', 'firstName lastName name avatar orgName email');
      if (event && event.owner && req.user && (event.owner._id || event.owner).toString() !== req.user.id) {
        return res.status(403).json({ message: 'User not authorized to access this quiz' });
      }
    }

    const quizObj = quiz.toObject();

    // If author is missing or still the placeholder default 'Eventeev Staff' or 'Organizer', resolve from creator profile or event owner
    if (!quizObj.author || quizObj.author === 'Eventeev Staff' || quizObj.author === 'Organizer') {
      if (quiz.createdBy && typeof quiz.createdBy === 'object') {
        const u = quiz.createdBy;
        const resolvedName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.orgName || u.email;
        if (resolvedName) quizObj.author = resolvedName;
        if (u.avatar) quizObj.authorAvatar = u.avatar;
      } else if (event && event.owner && typeof event.owner === 'object') {
        const u = event.owner;
        const resolvedName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.orgName || u.email;
        if (resolvedName) quizObj.author = resolvedName;
        if (u.avatar) quizObj.authorAvatar = u.avatar;
      }
    }

    res.json(quizObj);
  } catch (error) {
    console.error('getQuiz error:', error);
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
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let event = null;
    if (quiz.eventId) {
      event = await Event.findById(quiz.eventId);
      if (event && event.owner && req.user && event.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "User not authorized to host this quiz" });
      }
    }

    // Generate unique 6-digit PIN code
    let pin;
    let attempts = 0;
    while (attempts < 10) {
      const candidate = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await QuizSession.findOne({ pin: candidate, status: { $in: ["waiting", "active"] } });
      if (!existing) {
        pin = candidate;
        break;
      }
      attempts++;
    }
    if (!pin) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const hostId = (req.user && (req.user.id || req.user._id)) || (event && event.owner) || quiz.createdBy;
    if (!hostId) {
      return res.status(401).json({ message: "Host identification required" });
    }

    const session = new QuizSession({
      quizId: req.params.id,
      hostId,
      pin,
      status: "waiting",
      participants: []
    });

    await session.save();
    res.status(201).json({
      _id: session._id,
      id: session._id,
      quizId: session.quizId,
      hostId: session.hostId,
      pin: session.pin,
      status: session.status,
      participants: session.participants
    });
  } catch (error) {
    console.error("Error hosting quiz:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * Helper to sanitize question data for attendees (strips correctAnswer to prevent cheating).
 */
const formatSanitizedQuestion = (question, questionIndex, totalQuestions) => {
  if (!question) return null;
  return {
    questionIndex,
    totalQuestions,
    text: question.text,
    question: question.text,
    options: question.options || [],
    type: question.type || 'Quiz',
    timeLimit: question.timeLimit || 20,
    timeLimitSeconds: question.timeLimit || 20,
    points: question.points || 1000,
    mediaUrl: question.mediaUrl || null,
    imageUrl: question.mediaUrl || null,
    isMultiSelect: Boolean(question.isMultiSelect),
  };
};

/**
 * Helper to verify host or event owner authorization
 */
const verifyHostAuth = async (session, user, attendee) => {
  if (!session) return false;
  const currentUserId = user?.id || user?._id || attendee?.id || attendee?._id;
  if (!currentUserId) return false;

  // 1. Is user the hostId recorded on the session?
  if (session.hostId && session.hostId.toString() === currentUserId.toString()) {
    return true;
  }

  // 2. Is user the creator of the quiz?
  const quiz = session.quizId;
  if (quiz && quiz.createdBy && quiz.createdBy.toString() === currentUserId.toString()) {
    return true;
  }

  // 3. Is user the owner of the event that owns this quiz?
  if (quiz && quiz.eventId) {
    const event = await Event.findById(quiz.eventId);
    if (event && event.owner && event.owner.toString() === currentUserId.toString()) {
      return true;
    }
  }

  return false;
};

/**
 * @desc    Join a quiz session
 * @route   POST /api/game/quiz/session/join
 * @access  Public
 */
exports.joinSession = async (req, res) => {
  const { pin, nickname, userId } = req.body;
  if (!pin) {
    return res.status(400).json({ message: "A 6-digit Game PIN is required" });
  }
  if (!nickname || !nickname.trim()) {
    return res.status(400).json({ message: "Nickname is required to join" });
  }

  const cleanPin = pin.toString().replace(/\s+/g, "").trim();

  try {
    const session = await QuizSession.findOne({
      pin: cleanPin,
      status: { $in: ["waiting", "active"] },
    }).populate("quizId");

    if (!session) {
      return res.status(404).json({ message: "Game session not found or already completed" });
    }

    const trimmedNick = nickname.trim();
    const alreadyJoined = session.participants.some(
      (p) => (p.nickname && p.nickname.toLowerCase() === trimmedNick.toLowerCase()) ||
             (userId && p.userId && p.userId.toString() === userId.toString())
    );

    if (!alreadyJoined) {
      session.participants.push({
        userId: userId || undefined,
        nickname: trimmedNick,
        score: 0,
        streak: 0,
      });
      await session.save();
    }

    // Broadcast new player joined to host waiting room screen
    try {
      const { getIO } = require('../utils/socket');
      const io = getIO();
      io.to(`quiz_${cleanPin}`).emit('player_joined', {
        pin: cleanPin,
        player: {
          nickname: trimmedNick,
          userId: userId || undefined,
          score: 0,
          streak: 0,
        },
        totalPlayers: session.participants.length,
        players: session.participants.map(p => ({
          userId: p.userId,
          nickname: p.nickname,
          score: p.score
        }))
      });
    } catch (_) {}

    // Include current question if session is already active (for late joiners or reconnects)
    const quiz = session.quizId;
    const totalQuestions = quiz?.questions?.length || 0;
    const qIndex = session.currentQuestionIndex || 0;
    let currentQuestion = null;
    if (session.status === 'active' && quiz?.questions && quiz.questions[qIndex]) {
      currentQuestion = formatSanitizedQuestion(quiz.questions[qIndex], qIndex, totalQuestions);
    }

    res.json({
      ...session.toObject(),
      totalQuestions,
      currentQuestion,
      question: currentQuestion
    });
  } catch (error) {
    console.error("Error joining session:", error);
    res.status(500).json({ message: error.message || "Server Error" });
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

    // Sort participants to get rank
    const sortedParticipants = session.participants.sort((a, b) => (b.score || 0) - (a.score || 0));
    const playerRank = sortedParticipants.findIndex(p => (
      (p.nickname && participant.nickname && p.nickname.toLowerCase() === participant.nickname.toLowerCase()) ||
      (p._id && participant._id && p._id.toString() === participant._id.toString())
    )) + 1;

    // Check if all active participants have submitted answers for this question
    const allAnswered =
      session.participants.length > 0 &&
      session.participants.every(p =>
        p.answers && p.answers.some(a => a.questionIndex === Number(questionIndex))
      );

    if (allAnswered) {
      console.log(`[AutoAdvance] All participants answered Question ${questionIndex} for PIN ${pin}. Revealing in 1.2s...`);
      clearSessionTimer(pin);
      setTimeout(async () => {
        try {
          await triggerRevealAnswer(pin);
        } catch (e) {
          console.error('[AutoAdvance] Early reveal error:', e.message);
        }
      }, 1200);
    }

    res.json({
      isCorrect,
      points: totalPoints,
      basePoints,
      streakBonus,
      streak: participant.streak,
      currentScore: participant.score,
      correctOptionIndex: correctAnswers.length > 0 ? correctAnswers[0] : 0,
      rank: playerRank > 0 ? playerRank : 1,
      totalParticipants: session.participants.length
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
 * @desc    Get session status and current question (Public for attendees & hosts)
 * @route   GET /api/game/quiz/session/:pin
 * @access  Public
 */
exports.getSession = async (req, res) => {
  const { pin } = req.params;
  if (!pin) {
    return res.status(400).json({ message: 'A 6-digit Game PIN is required' });
  }

  const cleanPin = pin.toString().replace(/\s+/g, '').trim();

  try {
    const session = await QuizSession.findOne({ pin: cleanPin }).populate('quizId');
    if (!session) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    const quiz = session.quizId;
    const totalQuestions = quiz?.questions?.length || 0;
    const qIndex = session.currentQuestionIndex || 0;

    let currentQuestion = null;
    if (session.status === 'active' && quiz?.questions && quiz.questions[qIndex]) {
      currentQuestion = formatSanitizedQuestion(quiz.questions[qIndex], qIndex, totalQuestions);
    }

    res.json({
      _id: session._id,
      id: session._id,
      quizId: session.quizId?._id || session.quizId,
      pin: session.pin,
      status: session.status,
      currentQuestionIndex: qIndex,
      totalQuestions,
      currentQuestion,
      question: currentQuestion,
      participantsCount: session.participants?.length || 0,
      quizTitle: quiz?.title || 'Quiz Game',
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

/**
 * @desc    Start a quiz session (Admin / Host initiates question 1)
 * @route   POST /api/game/quiz/session/:pin/start
 * @access  Private
 */

// Track active question timers per quiz session pin
const activeSessionTimers = new Map();

function clearSessionTimer(pin) {
  if (activeSessionTimers.has(pin)) {
    clearTimeout(activeSessionTimers.get(pin));
    activeSessionTimers.delete(pin);
  }
}

/**
 * Core function to reveal answer and broadcast round results
 */
const triggerRevealAnswer = async (cleanPin) => {
  try {
    const session = await QuizSession.findOne({ pin: cleanPin }).populate('quizId');
    if (!session || session.status === 'finished') return null;

    const quiz = session.quizId;
    const qIndex = session.currentQuestionIndex || 0;
    const question = quiz?.questions?.[qIndex];
    if (!question) return null;

    const correctAnswers = (question.correctAnswer || []).map(Number);
    const correctOptionIndex = correctAnswers.length > 0 ? correctAnswers[0] : 0;

    // Compile answer distribution
    const distribution = (question.options || []).map((_, idx) => {
      let count = 0;
      session.participants.forEach(p => {
        const ans = p.answers?.find(a => a.questionIndex === qIndex);
        if (ans && ans.answer && ans.answer.includes(idx)) {
          count++;
        }
      });
      return count;
    });

    const sortedParticipants = session.participants
      .map(p => ({
        userId: p.userId,
        nickname: p.nickname,
        score: p.score || 0,
        streak: p.streak || 0,
        lastAnswerCorrect: p.lastAnswerCorrect || false,
      }))
      .sort((a, b) => b.score - a.score);

    const payload = {
      pin: cleanPin,
      sessionId: session._id,
      status: 'reveal',
      gameState: 'round_reveal',
      state: 'reveal',
      questionIndex: qIndex,
      correctOptionIndex,
      correctAnswer: correctOptionIndex,
      correctAnswers,
      distribution,
      leaderboard: sortedParticipants.slice(0, 10),
    };

    try {
      const { getIO } = require('../utils/socket');
      const io = getIO();
      io.to(`quiz_${cleanPin}`).emit('question_ended', payload);
      io.to(`quiz_${cleanPin}`).emit('round_ended', payload);
      io.to(`quiz_${cleanPin}`).emit('round_result', payload);
      io.to(`quiz_${cleanPin}`).emit('game_state_changed', payload);
    } catch (socketErr) {}

    // Auto-advance to next question or game over after 4 seconds of round reveal
    clearSessionTimer(cleanPin);
    const advanceTimer = setTimeout(async () => {
      try {
        await advanceSessionQuestion(cleanPin);
      } catch (err) {
        console.error('[AutoAdvance] Error advancing after reveal:', err.message);
      }
    }, 4000);
    activeSessionTimers.set(cleanPin, advanceTimer);

    return payload;
  } catch (err) {
    console.error('[triggerRevealAnswer] Error:', err.message);
    return null;
  }
};

/**
 * Core function to advance to next question or complete game
 */
const advanceSessionQuestion = async (cleanPin) => {
  try {
    const session = await QuizSession.findOne({ pin: cleanPin }).populate('quizId');
    if (!session || session.status === 'finished') return null;

    const quiz = session.quizId;
    if (!quiz) return null;

    const totalQuestions = quiz.questions?.length || 0;
    const nextIndex = (session.currentQuestionIndex || 0) + 1;

    if (nextIndex < totalQuestions) {
      session.currentQuestionIndex = nextIndex;
      session.status = 'active';
      await session.save();

      const nextQ = formatSanitizedQuestion(quiz.questions[nextIndex], nextIndex, totalQuestions);

      const payload = {
        pin: cleanPin,
        sessionId: session._id,
        status: 'active',
        gameState: 'active',
        state: 'active',
        currentQuestionIndex: nextIndex,
        questionIndex: nextIndex,
        totalQuestions,
        currentQuestion: nextQ,
        question: nextQ,
        timeLimitSeconds: nextQ?.timeLimitSeconds || 20,
        options: nextQ?.options || [],
        introSeconds: 3,
        startedAt: Date.now(),
      };

      try {
        const { getIO } = require('../utils/socket');
        const io = getIO();
        io.to(`quiz_${cleanPin}`).emit('next_question', payload);
        io.to(`quiz_${cleanPin}`).emit('new_question', payload);
        io.to(`quiz_${cleanPin}`).emit('question_start', payload);
        io.to(`quiz_${cleanPin}`).emit('question_started', payload);
        io.to(`quiz_${cleanPin}`).emit('game_state_changed', payload);
      } catch (socketErr) {}

      // Schedule question timer auto-advance
      scheduleSessionQuestionTimer(cleanPin, nextIndex, nextQ?.timeLimitSeconds || 20);

      return payload;
    } else {
      // All questions completed -> Game Over & Final Podium!
      session.status = 'finished';
      await session.save();

      const sortedParticipants = session.participants
        .map((p, idx) => ({
          userId: p.userId,
          name: p.nickname || `Player ${idx + 1}`,
          nickname: p.nickname || `Player ${idx + 1}`,
          score: p.score || 0,
          streak: p.streak || 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({ ...p, rank: idx + 1 }));

      const gameOverPayload = {
        pin: cleanPin,
        sessionId: session._id,
        status: 'finished',
        gameState: 'game_over',
        state: 'ended',
        totalParticipants: session.participants.length,
        topLeaderboard: sortedParticipants.slice(0, 10),
        leaderboard: sortedParticipants,
      };

      try {
        const { getIO } = require('../utils/socket');
        const io = getIO();
        io.to(`quiz_${cleanPin}`).emit('game_over', gameOverPayload);
        io.to(`quiz_${cleanPin}`).emit('quiz_ended', gameOverPayload);
        io.to(`quiz_${cleanPin}`).emit('game_state_changed', gameOverPayload);
      } catch (socketErr) {}

      clearSessionTimer(cleanPin);
      return gameOverPayload;
    }
  } catch (err) {
    console.error('[advanceSessionQuestion] Error:', err.message);
    return null;
  }
};

function scheduleSessionQuestionTimer(pin, questionIndex, durationSeconds) {
  clearSessionTimer(pin);
  // Account for admin countdown synchronization:
  // Question 0 has 5s initial countdown + 3s intro teaser = 8s
  // Subsequent questions (Q > 0) have 3s intro teaser
  const syncDelay = questionIndex === 0 ? 8 : 3;
  const duration = (durationSeconds || 20) + syncDelay + 1;
  console.log(`[AutoAdvance] Scheduling question ${questionIndex} timeout (${duration}s total, including ${syncDelay}s countdown/intro delay) for PIN ${pin}`);
  const timer = setTimeout(async () => {
    try {
      const session = await QuizSession.findOne({ pin });
      if (session && session.status === 'active' && session.currentQuestionIndex === questionIndex) {
        console.log(`[AutoAdvance] Question ${questionIndex} timer expired for PIN ${pin}. Auto-revealing answer...`);
        await triggerRevealAnswer(pin);
      }
    } catch (err) {
      console.error(`[AutoAdvance] Timer error for PIN ${pin}:`, err.message);
    }
  }, duration * 1000);

  activeSessionTimers.set(pin, timer);
}

exports.startSession = async (req, res) => {
  const { pin } = req.params;
  const cleanPin = pin.toString().replace(/\s+/g, '').trim();

  try {
    const session = await QuizSession.findOne({ pin: cleanPin }).populate('quizId');
    if (!session) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    const quiz = session.quizId;
    if (!quiz) {
      return res.status(404).json({ message: 'Associated quiz not found' });
    }

    const authorized = await verifyHostAuth(session, req.user, req.attendee);
    if (!authorized) {
      return res.status(403).json({ message: 'User not authorized to start this game' });
    }

    session.status = 'active';
    session.currentQuestionIndex = 0;
    await session.save();

    const totalQuestions = quiz.questions?.length || 0;
    const currentQ = quiz.questions?.[0]
      ? formatSanitizedQuestion(quiz.questions[0], 0, totalQuestions)
      : null;

    const payload = {
      pin: cleanPin,
      sessionId: session._id,
      status: 'active',
      gameState: 'active',
      state: 'active',
      currentQuestionIndex: 0,
      questionIndex: 0,
      totalQuestions,
      currentQuestion: currentQ,
      question: currentQ,
      timeLimitSeconds: currentQ?.timeLimitSeconds || 20,
      options: currentQ?.options || [],
      countdownSeconds: 5,
      introSeconds: 3,
      startedAt: Date.now(),
    };

    // Broadcast to real-time Socket.IO room
    try {
      const { getIO } = require('../utils/socket');
      const io = getIO();
      io.to(`quiz_${cleanPin}`).emit('game_started', payload);
      io.to(`quiz_${cleanPin}`).emit('quiz_started', payload);
      io.to(`quiz_${cleanPin}`).emit('question_start', payload);
      io.to(`quiz_${cleanPin}`).emit('question_started', payload);
      io.to(`quiz_${cleanPin}`).emit('game_state_changed', payload);
    } catch (socketErr) {
      console.warn('Socket broadcast skipped:', socketErr.message);
    }

    // Automatically schedule timer for Question 0
    scheduleSessionQuestionTimer(cleanPin, 0, currentQ?.timeLimitSeconds || 20);

    res.json({
      message: 'Game session started successfully',
      ...payload
    });
  } catch (error) {
    console.error('Error starting game session:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

/**
 * @desc    Advance to the next question or complete game
 * @route   POST /api/game/quiz/session/:pin/next
 * @access  Private
 */
exports.nextQuestion = async (req, res) => {
  const { pin } = req.params;
  const cleanPin = pin.toString().replace(/\s+/g, '').trim();

  try {
    const session = await QuizSession.findOne({ pin: cleanPin }).populate('quizId');
    if (!session) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    const quiz = session.quizId;
    if (!quiz) {
      return res.status(404).json({ message: 'Associated quiz not found' });
    }

    const authorized = await verifyHostAuth(session, req.user, req.attendee);
    if (!authorized) {
      return res.status(403).json({ message: 'User not authorized to advance this game' });
    }

    const totalQuestions = quiz.questions?.length || 0;
    const nextIndex = (session.currentQuestionIndex || 0) + 1;

    if (nextIndex < totalQuestions) {
      session.currentQuestionIndex = nextIndex;
      session.status = 'active';
      await session.save();

      const nextQ = formatSanitizedQuestion(quiz.questions[nextIndex], nextIndex, totalQuestions);

      const payload = {
        pin: cleanPin,
        sessionId: session._id,
        status: 'active',
        gameState: 'active',
        state: 'active',
        currentQuestionIndex: nextIndex,
        questionIndex: nextIndex,
        totalQuestions,
        currentQuestion: nextQ,
        question: nextQ,
        timeLimitSeconds: nextQ?.timeLimitSeconds || 20,
        options: nextQ?.options || [],
      };

      try {
        const { getIO } = require('../utils/socket');
        const io = getIO();
        io.to(`quiz_${cleanPin}`).emit('next_question', payload);
        io.to(`quiz_${cleanPin}`).emit('new_question', payload);
        io.to(`quiz_${cleanPin}`).emit('question_start', payload);
        io.to(`quiz_${cleanPin}`).emit('question_started', payload);
        io.to(`quiz_${cleanPin}`).emit('game_state_changed', payload);
      } catch (socketErr) {}

      scheduleSessionQuestionTimer(cleanPin, nextIndex, nextQ?.timeLimitSeconds || 20);

      return res.json({
        message: 'Advanced to next question',
        ...payload
      });
    } else {
      session.status = 'finished';
      await session.save();

      const sortedParticipants = session.participants
        .map((p, idx) => ({
          userId: p.userId,
          name: p.nickname || `Player ${idx + 1}`,
          nickname: p.nickname || `Player ${idx + 1}`,
          score: p.score || 0,
          streak: p.streak || 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({ ...p, rank: idx + 1 }));

      const gameOverPayload = {
        pin: cleanPin,
        sessionId: session._id,
        status: 'finished',
        gameState: 'game_over',
        state: 'ended',
        totalParticipants: session.participants.length,
        topLeaderboard: sortedParticipants.slice(0, 10),
        leaderboard: sortedParticipants,
      };

      try {
        const { getIO } = require('../utils/socket');
        const io = getIO();
        io.to(`quiz_${cleanPin}`).emit('game_over', gameOverPayload);
        io.to(`quiz_${cleanPin}`).emit('quiz_ended', gameOverPayload);
        io.to(`quiz_${cleanPin}`).emit('game_state_changed', gameOverPayload);
      } catch (socketErr) {}

      clearSessionTimer(cleanPin);

      return res.json({
        message: 'Quiz completed',
        ...gameOverPayload
      });
    }
  } catch (error) {
    console.error('Error advancing quiz question:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

/**
 * @desc    Reveal answer / round results for the current question
 * @route   POST /api/game/quiz/session/:pin/reveal
 * @access  Private
 */
exports.revealAnswer = async (req, res) => {
  const { pin } = req.params;
  const cleanPin = pin.toString().replace(/\s+/g, '').trim();

  try {
    const session = await QuizSession.findOne({ pin: cleanPin });
    if (!session) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    const authorized = await verifyHostAuth(session, req.user, req.attendee);
    if (!authorized) {
      return res.status(403).json({ message: 'User not authorized to reveal this game' });
    }

    const payload = await triggerRevealAnswer(cleanPin);
    if (!payload) {
      return res.status(400).json({ message: 'Current question could not be revealed' });
    }

    res.json(payload);
  } catch (error) {
    console.error('Error revealing question answer:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

/**
 * @desc    End game manually
 * @route   POST /api/game/quiz/session/:pin/end
 * @access  Private
 */
exports.endSession = async (req, res) => {
  const { pin } = req.params;
  const cleanPin = pin.toString().replace(/\s+/g, '').trim();

  try {
    const session = await QuizSession.findOne({ pin: cleanPin }).populate('quizId');
    if (!session) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    const authorized = await verifyHostAuth(session, req.user, req.attendee);
    if (!authorized) {
      return res.status(403).json({ message: 'User not authorized to end this game' });
    }

    session.status = 'finished';
    await session.save();

    const sortedParticipants = session.participants
      .map((p, idx) => ({
        userId: p.userId,
        name: p.nickname || `Player ${idx + 1}`,
        nickname: p.nickname || `Player ${idx + 1}`,
        score: p.score || 0,
        streak: p.streak || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    const gameOverPayload = {
      pin: cleanPin,
      sessionId: session._id,
      status: 'finished',
      gameState: 'game_over',
      totalParticipants: session.participants.length,
      topLeaderboard: sortedParticipants.slice(0, 10),
      leaderboard: sortedParticipants,
    };

    try {
      const { getIO } = require('../utils/socket');
      const io = getIO();
      io.to(`quiz_${cleanPin}`).emit('game_over', gameOverPayload);
      io.to(`quiz_${cleanPin}`).emit('quiz_ended', gameOverPayload);
      io.to(`quiz_${cleanPin}`).emit('game_state_changed', gameOverPayload);
    } catch (socketErr) {}

    res.json({ message: 'Game session ended', ...gameOverPayload });
  } catch (error) {
    console.error('Error ending quiz session:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
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
