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
  const { 
    eventId, 
    firstName, 
    lastName, 
    title, 
    company, 
    bio, 
    topic, 
    photo, 
    socialLinks,
    twitter,
    companyTwitter
  } = req.body;

  try {
    // Structure social links if they were passed flatly
    const finalSocialLinks = socialLinks || {
      twitter: twitter || '',
      companyTwitter: companyTwitter || ''
    };

    const speaker = new Speaker({
      eventId,
      firstName,
      lastName,
      title,
      company,
      bio,
      topic,
      photo,
      socialLinks: finalSocialLinks
    });

    await speaker.save();
    res.status(201).json(speaker);
  } catch (error) {
    console.error('[Create Speaker] Error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    // Handle invalid ObjectId for eventId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Event ID' });
    }

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
