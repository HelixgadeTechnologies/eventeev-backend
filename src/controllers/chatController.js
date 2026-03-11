const Room = require('../models/Room');
const Message = require('../models/Message');

/**
 * @desc    Create a new chat room
 * @route   POST /api/chat/room
 * @access  Private
 */
exports.createRoom = async (req, res) => {
  const { event, name, type, leadParticipant } = req.body;
  try {
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
