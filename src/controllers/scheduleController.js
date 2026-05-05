const Schedule = require('../models/Schedule');
const Event = require('../models/Event');


/**
 * @desc    Create a new schedule item
 * @route   POST /api/schedule
 * @access  Private
 */
exports.createScheduleItem = async (req, res) => {
  const { event, startTime, endTime, title, type, description, speakers } = req.body;
  try {
    // Check ownership
    const eventObj = await Event.findById(event);
    if (!eventObj || eventObj.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to create schedule items for this event' });
    }

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

/**
 * @desc    Update a schedule item
 * @route   PUT /api/schedule/:id
 * @access  Private
 */
exports.updateScheduleItem = async (req, res) => {
  try {
    const scheduleItem = await Schedule.findById(req.params.id);

    if (!scheduleItem) {
      return res.status(404).json({ message: 'Schedule item not found' });
    }

    // Check ownership
    const eventObj = await Event.findById(scheduleItem.event);
    if (!eventObj || eventObj.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this schedule item' });
    }

    const updatedItem = await Schedule.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedItem);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete a schedule item
 * @route   DELETE /api/schedule/:id
 * @access  Private
 */
exports.deleteScheduleItem = async (req, res) => {
  try {
    const scheduleItem = await Schedule.findById(req.params.id);

    if (!scheduleItem) {
      return res.status(404).json({ message: 'Schedule item not found' });
    }

    // Check ownership
    const eventObj = await Event.findById(scheduleItem.event);
    if (!eventObj || eventObj.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this schedule item' });
    }

    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule item removed' });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
