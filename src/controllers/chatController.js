const Room = require('../models/Room');
const Message = require('../models/Message');
const Event = require('../models/Event');
const mongoose = require('mongoose');

/**
 * @desc    Create a new chat room or get existing 1-on-1 direct room
 * @route   POST /api/chat/room
 * @access  Private (multiAuth: User or Attendee)
 */
exports.createRoom = async (req, res) => {
  const { event, eventId, name, type, isGroup, participantIds, participants, leadParticipant } = req.body;
  const targetEventId = event || eventId;

  if (!targetEventId || !mongoose.Types.ObjectId.isValid(targetEventId)) {
    return res.status(400).json({ message: 'Valid event ID is required' });
  }

  try {
    const eventObj = await Event.findById(targetEventId);
    if (!eventObj) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const requesterId = req.user ? req.user.id : req.attendee?.id;
    const isOwner = Boolean(req.user && eventObj.owner.toString() === req.user.id);

    // Determine if this room is a 1-on-1 direct message
    const isDirect = (type === 'private' || isGroup === false);

    // Group rooms can only be created by the event owner/organizer
    if (!isDirect && !isOwner) {
      return res.status(403).json({ message: 'User not authorized to create group rooms for this event' });
    }

    // Build unique participant IDs list
    let pIds = Array.isArray(participantIds) ? participantIds.map(String).filter(Boolean) : [];
    if (requesterId && !pIds.includes(String(requesterId))) {
      pIds.push(String(requesterId));
    }
    if (leadParticipant && typeof leadParticipant === 'string' && !pIds.includes(String(leadParticipant))) {
      pIds.push(String(leadParticipant));
    }

    // If it's a 1-on-1 direct room, check if an existing room between these participants already exists
    if (isDirect && pIds.length >= 2) {
      const existing = await Room.findOne({
        event: targetEventId,
        isGroup: false,
        participantIds: { $all: pIds, $size: pIds.length }
      });
      if (existing) {
        return res.json(existing);
      }
    }

    const room = new Room({
      event: targetEventId,
      name: name || (isDirect ? 'Direct Message' : 'Public Lobby'),
      type: type || (isDirect ? 'private' : 'public'),
      isGroup: !isDirect,
      participantIds: pIds,
      participants: Array.isArray(participants) ? participants : [],
      leadParticipant: (leadParticipant && typeof leadParticipant === 'string' && mongoose.Types.ObjectId.isValid(leadParticipant)) ? leadParticipant : undefined,
      createdBy: req.user ? req.user.id : undefined,
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('createRoom error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Get all accessible rooms for an event (Strictly isolated by participant)
 * @route   GET /api/chat/rooms/:eventId
 * @access  Private / Public (multiAuth)
 */
exports.getRooms = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: 'Valid event ID is required' });
  }

  try {
    const requesterId = req.user ? req.user.id : req.attendee?.id;
    const eventObj = await Event.findById(eventId);
    const isOwner = Boolean(req.user && eventObj && eventObj.owner.toString() === req.user.id);

    let query;
    if (isOwner) {
      // Event owner/admin sees all group channels + all direct message rooms in the event
      query = { event: eventId };
    } else if (requesterId) {
      // Attendee sees:
      // 1. All group rooms (isGroup = true OR legacy rooms with type != 'private')
      // 2. Direct message rooms WHERE participantIds includes their ID
      query = {
        event: eventId,
        $or: [
          { isGroup: true },
          { isGroup: { $exists: false }, type: { $ne: 'private' } },
          { isGroup: false, participantIds: String(requesterId) }
        ]
      };
    } else {
      // Public / unauthenticated: Only group/public rooms
      query = {
        event: eventId,
        $or: [
          { isGroup: true },
          { isGroup: { $exists: false }, type: { $ne: 'private' } }
        ]
      };
    }

    const rooms = await Room.find(query)
      .populate('leadParticipant', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (error) {
    console.error('getRooms error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Get message history for a room (Protected: only participants or owner can read private rooms)
 * @route   GET /api/chat/messages/:roomId
 * @access  Private (multiAuth)
 */
exports.getMessages = async (req, res) => {
  const { roomId } = req.params;

  if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ message: 'Valid room ID is required' });
  }

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const requesterId = req.user ? req.user.id : req.attendee?.id;
    const isDirect = (room.isGroup === false || room.type === 'private');

    // Access control for direct messages: only allowed participants or event owner
    if (isDirect) {
      const eventObj = await Event.findById(room.event);
      const isOwner = Boolean(req.user && eventObj && eventObj.owner.toString() === req.user.id);
      const isParticipant = Boolean(requesterId && room.participantIds && room.participantIds.includes(String(requesterId)));
      const isCreator = Boolean(requesterId && room.createdBy && room.createdBy.toString() === String(requesterId));

      if (!isOwner && !isParticipant && !isCreator) {
        return res.status(403).json({ message: 'Access denied: You are not authorized to view this private conversation' });
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    const total = await Message.countDocuments({ room: roomId });
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      data: messages.reverse(),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Send a message to a room (Protected: only authorized users can post to private rooms)
 * @route   POST /api/chat/messages/:roomId
 * @access  Private (multiAuth)
 */
exports.sendMessage = async (req, res) => {
  const { roomId } = req.params;
  const { content, type, senderName, senderAvatar } = req.body;

  if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ message: 'Valid room ID is required' });
  }

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const requesterId = req.user ? req.user.id : req.attendee?.id;
    const senderModel = req.user ? 'User' : 'Attendee';
    const isDirect = (room.isGroup === false || room.type === 'private');

    if (isDirect) {
      const eventObj = await Event.findById(room.event);
      const isOwner = Boolean(req.user && eventObj && eventObj.owner.toString() === req.user.id);
      const isParticipant = Boolean(requesterId && room.participantIds && room.participantIds.includes(String(requesterId)));

      if (!isOwner && !isParticipant) {
        return res.status(403).json({ message: 'Access denied: You cannot send messages to this private conversation' });
      }
    }

    const message = new Message({
      room: roomId,
      sender: requesterId,
      senderModel,
      senderName,
      senderAvatar,
      content,
      type: type || 'user_message'
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
