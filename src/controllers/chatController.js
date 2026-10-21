const Room = require('../models/Room');
const Message = require('../models/Message');
const Event = require('../models/Event');
const User = require('../models/User');
const Attendee = require('../models/Attendee');
const mongoose = require('mongoose');
const { getIO } = require('../utils/socket');
const { assertAttendeeCheckedIn } = require('../utils/chatAuth');

/**
 * Helper to resolve participant profile info (User or Attendee)
 */
async function resolveParticipant(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  // Check User collection first (Organizer / Admin)
  const user = await User.findById(id).select('firstName lastName orgName avatar');
  if (user) {
    const fullName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.orgName || 'Organizer';
    return {
      id: String(user._id),
      modelType: 'User',
      name: fullName,
      avatar: user.avatar || null,
      role: 'admin',
    };
  }

  // Check Attendee collection
  const attendee = await Attendee.findById(id).select('name');
  if (attendee) {
    return {
      id: String(attendee._id),
      modelType: 'Attendee',
      name: attendee.name,
      avatar: null,
      role: 'attendee',
    };
  }

  return null;
}

/**
 * @desc    Get participant directory for an event (Organizer + Confirmed Attendees)
 * @route   GET /api/chat/participants/:eventId
 * @access  Private (multiAuth: Organizer or registered Attendee)
 */
exports.getParticipants = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: 'Valid event ID is required' });
  }

  try {
    const event = await Event.findById(eventId).populate('owner', 'firstName lastName orgName avatar email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const requesterId = req.user ? req.user.id : req.attendee?.id;
    const isOwner = Boolean(req.user && event.owner && event.owner._id.toString() === req.user.id);

    // Attendees must be checked in to access chat participants
    if (!isOwner && req.attendee) {
      const { allowed, reason } = await assertAttendeeCheckedIn(req.attendee.id, eventId);
      if (!allowed) {
        return res.status(403).json({ message: reason });
      }
    }

    // 1. Organizer entry
    const organizer = event.owner ? {
      id: String(event.owner._id),
      name: event.owner.name || `${event.owner.firstName || ''} ${event.owner.lastName || ''}`.trim() || event.owner.orgName || 'Organizer',
      avatar: event.owner.avatar || null,
      role: 'organizer',
      modelType: 'User',
      isCurrentUser: String(event.owner._id) === String(requesterId),
    } : null;

    // 2. Verified attendees (exclude cancelled, support ObjectId & string eventId)
    const eventQuery = mongoose.Types.ObjectId.isValid(eventId)
      ? { $in: [eventId, new mongoose.Types.ObjectId(eventId)] }
      : eventId;

    const attendeesList = await Attendee.find({
      eventId: eventQuery,
      status: { $ne: 'cancelled' },
      $or: [
        { isCheckedIn: true },
        { checkInTime: { $exists: true, $ne: null } },
        { status: 'verified' }
      ]
    }).select('name email avatar status isCheckedIn checkInTime createdAt');

    const attendees = attendeesList.map(att => ({
      id: String(att._id),
      name: att.name,
      avatar: null,
      role: 'attendee',
      modelType: 'Attendee',
      status: att.status,
      isCheckedIn: Boolean(att.isCheckedIn || att.checkInTime),
      checkInTime: att.checkInTime || null,
      isCurrentUser: String(att._id) === String(requesterId),
    }));

    res.json({
      organizer,
      attendees,
      totalCount: (organizer ? 1 : 0) + attendees.length
    });
  } catch (error) {
    console.error('getParticipants error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

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

    // Attendees must be checked in to create or access chat rooms
    if (!isOwner && req.attendee) {
      const { allowed, reason } = await assertAttendeeCheckedIn(req.attendee.id, targetEventId);
      if (!allowed) {
        return res.status(403).json({ message: reason });
      }
    }

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

    if (isDirect && pIds.length < 2) {
      return res.status(400).json({ message: 'Direct message requires at least one other participant' });
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

    // Auto-resolve participant profiles if not passed or empty
    let resolvedParticipants = Array.isArray(participants) && participants.length > 0 ? participants : [];
    if (isDirect && resolvedParticipants.length < pIds.length) {
      resolvedParticipants = [];
      for (const id of pIds) {
        const p = await resolveParticipant(id);
        if (p) resolvedParticipants.push(p);
      }
    }

    const room = new Room({
      event: targetEventId,
      name: name || (isDirect ? 'Direct Message' : 'Public Lobby'),
      type: type || (isDirect ? 'private' : 'public'),
      isGroup: !isDirect,
      participantIds: pIds,
      participants: resolvedParticipants,
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
    if (!eventObj) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const isOwner = Boolean(req.user && eventObj.owner.toString() === req.user.id);

    // Attendees must be checked in to view rooms
    if (!isOwner && req.attendee) {
      const { allowed, reason } = await assertAttendeeCheckedIn(req.attendee.id, eventId);
      if (!allowed) {
        return res.status(403).json({ message: reason });
      }
    }

    let query;
    if (isOwner && req.query.allRooms === 'true') {
      // Explicit moderation view requested by event owner
      query = { event: eventId };
    } else if (requesterId) {
      // Both Organizer and Attendees see:
      // 1. All group rooms (isGroup = true OR legacy rooms with type != 'private')
      // 2. Direct message rooms WHERE they are an explicit participant
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
      .populate('leadParticipant', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    // Format room display info (for DMs, personalize recipient info for requester)
    const formattedRooms = await Promise.all(rooms.map(async (room) => {
      const roomObj = room.toObject();
      if (room.isGroup === false && requesterId) {
        let otherParticipant = (room.participants || []).find(p => String(p.id) !== String(requesterId));
        if (!otherParticipant && room.participantIds?.length) {
          const otherId = room.participantIds.find(id => String(id) !== String(requesterId));
          if (otherId) {
            otherParticipant = await resolveParticipant(otherId);
          }
        }
        if (otherParticipant) {
          roomObj.otherParticipant = otherParticipant;
          if (!roomObj.name || roomObj.name === 'Direct Message') {
            roomObj.displayName = otherParticipant.name;
          }
        }
      }
      return roomObj;
    }));

    res.json(formattedRooms);
  } catch (error) {
    console.error('getRooms error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    (Organizer Only) Get all rooms in an event for audit/moderation
 * @route   GET /api/chat/admin/all-rooms/:eventId
 * @access  Private (Organizer only)
 */
exports.getAllRoomsAdmin = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: 'Valid event ID is required' });
  }

  try {
    const eventObj = await Event.findById(eventId);
    if (!eventObj) return res.status(404).json({ message: 'Event not found' });
    if (!req.user || eventObj.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the event organizer can access all rooms' });
    }

    const rooms = await Room.find({ event: eventId })
      .populate('leadParticipant', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (error) {
    console.error('getAllRoomsAdmin error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Get message history for a room (Protected: only participants can read private rooms)
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

    // Attendees must be checked in to view messages
    if (req.attendee) {
      const { allowed, reason } = await assertAttendeeCheckedIn(req.attendee.id, room.event.toString());
      if (!allowed) {
        return res.status(403).json({ message: reason });
      }
    }

    const requesterId = req.user ? req.user.id : req.attendee?.id;
    const isDirect = (room.isGroup === false || room.type === 'private');

    // Access control for direct messages: only allowed participants or explicit audit
    if (isDirect) {
      const isParticipant = Boolean(requesterId && room.participantIds && room.participantIds.includes(String(requesterId)));
      const isCreator = Boolean(requesterId && room.createdBy && room.createdBy.toString() === String(requesterId));

      let canAccess = isParticipant || isCreator;
      if (!canAccess && req.user && req.query.audit === 'true') {
        const eventObj = await Event.findById(room.event);
        if (eventObj && eventObj.owner.toString() === req.user.id) {
          canAccess = true;
        }
      }

      if (!canAccess) {
        return res.status(403).json({ message: 'Access denied: You are not authorized to view this private conversation' });
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    const total = await Message.countDocuments({ room: roomId });
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name firstName lastName avatar')
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
 * @desc    Send a message to a room (Protected: checks DM participant & announcement restrictions, broadcasts via Socket)
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
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const senderModel = req.user ? 'User' : 'Attendee';
    const isDirect = (room.isGroup === false || room.type === 'private');

    const eventObj = await Event.findById(room.event);
    if (!eventObj) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const isOwner = Boolean(req.user && eventObj.owner.toString() === req.user.id);

    // Attendees must be checked in to send messages
    if (!isOwner && req.attendee) {
      const { allowed, reason } = await assertAttendeeCheckedIn(req.attendee.id, eventObj._id.toString());
      if (!allowed) {
        return res.status(403).json({ message: reason });
      }
    }

    // Direct room check: only participants can send messages
    if (isDirect) {
      const isParticipant = Boolean(room.participantIds && room.participantIds.includes(String(requesterId)));
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied: You cannot send messages to this private conversation' });
      }
    }

    // Announcement room check: only organizers can post
    if (room.type === 'announcement' && !isOwner) {
      return res.status(403).json({ message: 'Only event organizers can post in announcement channels' });
    }

    // Resolve sender display name and avatar if not provided
    let finalSenderName = senderName;
    let finalSenderAvatar = senderAvatar;
    if (!finalSenderName) {
      if (req.user) {
        const u = await User.findById(requesterId).select('firstName lastName orgName avatar');
        if (u) {
          finalSenderName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Organizer';
          finalSenderAvatar = u.avatar || null;
        }
      } else if (req.attendee) {
        const a = await Attendee.findById(requesterId).select('name');
        if (a) finalSenderName = a.name;
      }
    }

    const message = new Message({
      room: roomId,
      sender: requesterId,
      senderModel,
      senderName: finalSenderName,
      senderAvatar: finalSenderAvatar,
      content,
      type: type || 'user_message'
    });

    await message.save();

    // Populate sender object
    let populatedMessage = await Message.findById(message._id).populate('sender', 'name firstName lastName avatar');
    if (!populatedMessage?.sender || typeof populatedMessage.sender !== 'object') {
      populatedMessage = {
        ...populatedMessage.toObject(),
        sender: {
          _id: requesterId,
          id: requesterId,
          name: finalSenderName || 'User',
          avatar: finalSenderAvatar || null
        }
      };
    }

    // Broadcast to real-time WebSocket room
    try {
      const io = getIO();
      io.to(roomId).emit('receive_message', populatedMessage);
    } catch (socketErr) {
      // Socket.IO may not be initialized in non-server tests
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
