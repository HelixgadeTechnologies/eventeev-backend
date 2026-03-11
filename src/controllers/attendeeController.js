const Attendee = require('../models/Attendee');

/**
 * @desc    Get all attendees for an event
 * @route   GET /api/attendee/event/:eventId
 * @access  Private
 */
exports.getAttendeesByEvent = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = { eventId: req.params.eventId };

    if (status && status !== 'All') {
      query.status = status.toLowerCase();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const attendees = await Attendee.find(query).sort({ registrationDate: -1 });
    res.json(attendees);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get attendee stats for an event
 * @route   GET /api/attendee/event/:eventId/stats
 * @access  Private
 */
exports.getAttendeeStats = async (req, res) => {
  try {
    const totalAttendees = await Attendee.countDocuments({ eventId: req.params.eventId });
    const verifiedAccess = await Attendee.countDocuments({ eventId: req.params.eventId, isCheckedIn: true });
    
    // Recent activity (e.g., check-ins in the last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentActivity = await Attendee.countDocuments({
      eventId: req.params.eventId,
      isCheckedIn: true,
      checkInTime: { $gte: thirtyMinutesAgo }
    });

    res.json({
      totalAttendees,
      verifiedAccess,
      recentActivity
    });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Check-in attendee (Toggle status)
 * @route   PATCH /api/attendee/:id/check-in
 * @access  Private
 */
exports.checkInAttendee = async (req, res) => {
  try {
    const attendee = await Attendee.findById(req.params.id);
    if (!attendee) return res.status(404).json({ message: 'Attendee not found' });

    attendee.isCheckedIn = !attendee.isCheckedIn;
    attendee.status = attendee.isCheckedIn ? 'verified' : 'pending';
    attendee.checkInTime = attendee.isCheckedIn ? new Date() : null;

    await attendee.save();
    res.json(attendee);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Create attendee (Manual registration)
 * @route   POST /api/attendee/create
 * @access  Private
 */
exports.createAttendee = async (req, res) => {
  try {
    const orderId = `CK-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
    const attendee = new Attendee({ ...req.body, orderId });
    await attendee.save();
    res.status(201).json(attendee);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete attendee
 * @route   DELETE /api/attendee/:id
 * @access  Private
 */
exports.deleteAttendee = async (req, res) => {
  try {
    const attendee = await Attendee.findByIdAndDelete(req.params.id);
    if (!attendee) return res.status(404).json({ message: 'Attendee not found' });
    res.json({ message: 'Attendee removed' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
