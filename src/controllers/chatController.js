const Room = require('../models/Room');
const Message = require('../models/Message');
const Event = require('../models/Event');


/**
 * @desc    Create a new chat room
 * @route   POST /api/chat/room
 * @access  Private
 */
exports.createRoom = async (req, res) => {
  const { event, name, type, leadParticipant } = req.body;
  try {
    // Check ownership
    const eventObj = await Event.findById(event);
    if (!eventObj || eventObj.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to create rooms for this event' });
    }

    const room = new Room({

      event,
      name,
      type,
      leadParticipant
    });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all rooms for an event
 * @route   GET /api/chat/rooms/:eventId
 * @access  Public
 */
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ event: req.params.eventId }).populate('leadParticipant', 'name avatar');
    res.json(rooms);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get message history for a room
 * @route   GET /api/chat/messages/:roomId
 * @access  Public
 */
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Send a message to a room
 * @route   POST /api/chat/messages/:roomId
 * @access  Private (MultiAuth)
 */
exports.sendMessage = async (req, res) => {
  const { content } = req.body;
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const senderId = req.user ? req.user.id : req.attendee.id;

    const message = new Message({
      room: req.params.roomId,
      sender: senderId,
      content
    });

    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
