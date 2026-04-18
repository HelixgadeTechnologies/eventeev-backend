const CalendarEvent = require('../models/CalendarEvent');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new calendar event
 * @route   POST /api/calendar
 * @access  Private
 */
exports.createCalendarEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      website,
      category,
      type
    } = req.body;

    const calendarEvent = new CalendarEvent({
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      website,
      category,
      type,
      owner: req.user ? req.user.id : null
    });

    await calendarEvent.save();
    res.status(201).json(calendarEvent);
  } catch (error) {
    console.error('[Create Calendar Event] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all calendar events (Public)
 * @route   GET /api/calendar
 * @access  Public
 */
exports.getCalendarEvents = async (req, res) => {
  try {
    const events = await CalendarEvent.find().sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    console.error('[Get Calendar Events] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Admin: Get all calendar events for management
 * @route   GET /api/calendar/admin
 * @access  Private/Admin
 */
exports.adminGetCalendarEvents = async (req, res) => {
  try {
    const events = await CalendarEvent.find()
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error('[Admin Get Calendar Events] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Admin: Delete a calendar event
 * @route   DELETE /api/calendar/:id
 * @access  Private/Admin
 */
exports.adminDeleteCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Calendar event not found' });
    }

    await event.deleteOne();
    res.json({ message: 'Calendar event removed successfully' });
  } catch (error) {
    console.error('[Admin Delete Calendar Event] Error:', error.message);
    res.status(500).send('Server Error');
  }
};
