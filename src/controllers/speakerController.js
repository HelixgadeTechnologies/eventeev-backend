const Speaker = require('../models/Speaker');

/**
 * @desc    Get all speakers for an event
 * @route   GET /api/speaker/event/:eventId
 * @access  Public
 */
exports.getSpeakersByEvent = async (req, res) => {
  try {
    const speakers = await Speaker.find({ eventId: req.params.eventId });
    res.json(speakers);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Create a new speaker
 * @route   POST /api/speaker/create
 * @access  Private
 */
exports.createSpeaker = async (req, res) => {
  const { eventId, firstName, lastName, title, company, bio, topic, photo, socialLinks } = req.body;
  try {
    const speaker = new Speaker({
      eventId,
      firstName,
      lastName,
      title,
      company,
      bio,
      topic,
      photo,
      socialLinks
    });
    await speaker.save();
    res.status(201).json(speaker);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get speaker by id
 * @route   GET /api/speaker/:id
 * @access  Public
 */
exports.getSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id);
    if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
    res.json(speaker);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update speaker
 * @route   PUT /api/speaker/edit/:id
 * @access  Private
 */
exports.updateSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
    res.json(speaker);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete speaker
 * @route   DELETE /api/speaker/:id
 * @access  Private
 */
exports.deleteSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findByIdAndDelete(req.params.id);
    if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
    res.json({ message: 'Speaker removed' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Add/Update sessions for speaker
 * @route   POST /api/speaker/:id/sessions
 * @access  Private
 */
exports.manageSessions = async (req, res) => {
  try {
    const { sessions } = req.body;
    const speaker = await Speaker.findByIdAndUpdate(
      req.params.id,
      { sessions },
      { new: true }
    );
    if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
    res.json(speaker);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
