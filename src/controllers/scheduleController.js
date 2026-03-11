const Schedule = require('../models/Schedule');

/**
 * @desc    Create a new schedule item
 * @route   POST /api/schedule
 * @access  Private
 */
exports.createSchedule = async (req, res) => {
  const { event, startTime, endTime, title, type, description, speakers } = req.body;
  try {
    const scheduleItem = new Schedule({
      event,
      startTime,
      endTime,
      title,
      type,
      description,
      speakers
    });
    await scheduleItem.save();
    res.status(201).json(scheduleItem);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get schedule for a specific event
 * @route   GET /api/schedule/event/:eventId
 * @access  Public
 */
exports.getEventSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.find({ event: req.params.eventId }).sort({ startTime: 1 });
    res.json(schedule);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
