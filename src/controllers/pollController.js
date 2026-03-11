const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

/**
 * @desc    Get all polls for an event
 * @route   GET /api/poll/event/:eventId
 * @access  Public
 */
exports.getPollsByEvent = async (req, res) => {
  try {
    const polls = await Poll.find({ eventId: req.params.eventId }).sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Create a new poll
 * @route   POST /api/poll/create
 * @access  Private
 */
exports.createPoll = async (req, res) => {
  try {
    const poll = new Poll(req.body);
    await poll.save();
    res.status(201).json(poll);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get detailed poll results
 * @route   GET /api/poll/:id
 * @access  Public
 */
exports.getPollResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json(poll);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Toggle poll status (LIVE/ENDED)
 * @route   PATCH /api/poll/:id/status
 * @access  Private
 */
exports.updatePollStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const poll = await Poll.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json(poll);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Submit a vote
 * @route   POST /api/poll/:id/vote
 * @access  Private
 */
exports.submitVote = async (req, res) => {
  const { questionId, optionId } = req.body;
  const pollId = req.params.id;
  const userId = req.user.id; // From auth middleware

  try {
    const poll = await Poll.findById(pollId);
    if (!poll || poll.status === 'ENDED') {
      return res.status(400).json({ message: 'Poll is closed or not found' });
    }

    // Create vote entry
    const vote = new Vote({
      userId,
      pollId,
      questionId,
      optionId
    });
    await vote.save();

    // Update denormalized vote counts in Poll model
    const question = poll.questions.id(questionId);
    const option = question.options.id(optionId);
    option.votesCount += 1;
    poll.totalResponses += 1;

    await poll.save();

    res.status(201).json({ message: 'Vote submitted successfully', poll });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already voted on this question' });
    }
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete a poll
 * @route   DELETE /api/poll/:id
 * @access  Private
 */
exports.deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    
    // Also delete associated votes
    await Vote.deleteMany({ pollId: req.params.id });
    
    res.json({ message: 'Poll and associated votes removed' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
