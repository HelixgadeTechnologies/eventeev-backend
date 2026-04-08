const { validationResult } = require('express-validator');
const Event = require('../models/Event');

/**
 * @desc    Get all published events
 * @route   GET /api/event/published
 * @access  Public
 */
exports.getPublishedEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'Published' });
    res.json(events);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get drafts
 * @route   GET /api/event/drafts
 * @access  Private
 */
exports.getDrafts = async (req, res) => {
  try {
    const events = await Event.find({ status: 'Draft' });
    res.json(events);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get completed events
 * @route   GET /api/event/completed
 * @access  Private
 */
exports.getCompletedEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'Completed' });
    res.json(events);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Publish event
 * @route   POST /api/event/publish
 * @access  Private
 */
exports.publishEvent = async (req, res) => {
  // 1. Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, category, type, date, time, location, bannerImage, status } = req.body;

  try {
    const event = new Event({
      owner: req.user.id,
      title,
      description,
      category,
      type,
      date,
      time,
      location,
      bannerImage,
      status: status || 'Published'
    });
    
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('[Publish Event] Error:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Draft to Live
 * @route   POST /api/event/drafttolive/:id
 * @access  Private
 */
exports.draftToLive = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.status = 'Published';
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/event/:id
 * @access  Private
 */
exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
