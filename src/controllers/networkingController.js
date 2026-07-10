const Connection = require('../models/Connection');
const Attendee = require('../models/Attendee');

/**
 * @desc    Get all networking-enabled attendees for an event
 * @route   GET /api/networking/attendees/:eventId
 * @access  Private (MultiAuth)
 */
exports.getNetworkingAttendees = async (req, res) => {
  try {
    // In a real app, you might filter by { isNetworkingEnabled: true } if you add that field.
    // For now, return all verified attendees for the event.
    const attendees = await Attendee.find({ 
      eventId: req.params.eventId,
      status: 'verified' 
    }).select('name email'); // Maybe add jobTitle, company if added to model

    res.json(attendees);
  } catch (error) {
    console.error('[Networking] Error fetching attendees:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Send a connection request
 * @route   POST /api/networking/connect
 * @access  Private (AttendeeAuth)
 */
exports.sendConnectionRequest = async (req, res) => {
  const { recipientId, eventId } = req.body;
  
  try {
    const requesterId = req.attendee.id;

    if (requesterId === recipientId) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ],
      eventId
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection already exists or is pending' });
    }

    const connection = new Connection({
      requester: requesterId,
      recipient: recipientId,
      eventId
    });

    await connection.save();

    res.status(201).json(connection);
  } catch (error) {
    console.error('[Networking] Error sending request:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update connection status (accept/reject)
 * @route   PATCH /api/networking/connect/:id
 * @access  Private (AttendeeAuth)
 */
exports.updateConnection = async (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'
  
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Only recipient can accept or reject
    if (connection.recipient.toString() !== req.attendee.id) {
      return res.status(403).json({ message: 'Not authorized to update this connection' });
    }

    connection.status = status;
    await connection.save();

    res.json(connection);
  } catch (error) {
    console.error('[Networking] Error updating connection:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get my connections for an event
 * @route   GET /api/networking/connections/:eventId
 * @access  Private (AttendeeAuth)
 */
exports.getMyConnections = async (req, res) => {
  try {
    const userId = req.attendee.id;

    const connections = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }],
      eventId: req.params.eventId
    })
    .populate('requester', 'name email')
    .populate('recipient', 'name email');

    res.json(connections);
  } catch (error) {
    console.error('[Networking] Error fetching connections:', error);
    res.status(500).send('Server Error');
  }
};
