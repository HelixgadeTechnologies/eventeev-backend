require('dotenv').config();
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
require('./instrument');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const app = require('./app');
const startEventStatusTask = require('./tasks/statusTask');
const startReminderTask = require('./tasks/reminderTask');

// Connect Database
connectDB();

// Start Background Tasks
startEventStatusTask();
startReminderTask();

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI', 'JWT_EXPIRES_IN', 'EMAIL_USER', 'EMAIL_APP_PASS'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('[CRITICAL] Missing required environment variables:', missingEnvVars.join(', '));
  console.error('[CRITICAL] Authentication and Database features will fail! Exiting process.');
  process.exit(1);
} else {
  console.log('[SUCCESS] All required environment variables are present.');
}

if (!process.env.PAYSTACK_SECRET_KEY) {
  console.warn('[WARNING] PAYSTACK_SECRET_KEY is missing from environment variables. Paystack payment processing will fail!');
} else {
  console.log('[SUCCESS] PAYSTACK_SECRET_KEY is configured.');
}

const { initSocket } = require('./utils/socket');
const server = http.createServer(app);
const io = initSocket(server);

// socket.js handles the connection and notification rooms.
// We'll keep the message logic here for now, but use the io instance from initSocket.
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Room = require('./models/Room');
const Message = require('./models/Message');
const Event = require('./models/Event');
const User = require('./models/User');
const Attendee = require('./models/Attendee');
const { assertAttendeeCheckedIn } = require('./utils/chatAuth');

io.on('connection', (socket) => {
  console.log('User connected to base socket:', socket.id);

  // Authenticate socket user or attendee from auth token or headers
  let token = socket.handshake.auth?.token || socket.handshake.headers?.['x-auth-token'] || socket.handshake.headers?.authorization;
  if (token) {
    if (typeof token === 'string' && token.startsWith('Bearer ')) {
      token = token.substring(7).trim();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.user) socket.user = decoded.user;
      else if (decoded.attendee) socket.attendee = decoded.attendee;
      else if (decoded.id) socket.attendee = { id: decoded.id, email: decoded.email, name: decoded.name };
    } catch (err) {
      // Token expired or invalid
    }
  }

  socket.on('join_room', async (roomId) => {
    // If roomId is a valid Mongo ObjectId, verify room permissions
    if (mongoose.Types.ObjectId.isValid(roomId)) {
      try {
        const roomDoc = await Room.findById(roomId);

        // Check-in gate for attendee sockets
        if (roomDoc && socket.attendee) {
          const { allowed, reason } = await assertAttendeeCheckedIn(
            socket.attendee.id,
            roomDoc.event.toString()
          );
          if (!allowed) {
            console.warn(`[Socket] Blocked un-checked-in attendee ${socket.attendee.id} from joining room ${roomId}`);
            socket.emit('chat_access_denied', { message: reason });
            return;
          }
        }

        if (roomDoc && (roomDoc.isGroup === false || roomDoc.type === 'private')) {
          const socketId = socket.user?.id || socket.attendee?.id;
          const isParticipant = socketId && roomDoc.participantIds && roomDoc.participantIds.includes(String(socketId));

          if (!isParticipant) {
            console.warn(`[Socket] Unauthorized join attempt to private room ${roomId} by socket ${socket.id} (user: ${socketId})`);
            socket.emit('error', { message: 'Unauthorized to join this private room' });
            return;
          }
        }
      } catch (err) {
        console.error('[Socket] Error verifying room join:', err);
      }
    }

    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    
    // Track participants count and emit activation status
    const room = io.sockets.adapter.rooms.get(roomId);
    const count = room ? room.size : 0;
    io.to(roomId).emit('room_status', {
      activated: count >= 2,
      count: count,
      roomId: roomId
    });
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
    
    // Update count for remaining users
    const room = io.sockets.adapter.rooms.get(roomId);
    const count = room ? room.size : 0;
    io.to(roomId).emit('room_status', {
      activated: count >= 2,
      count: count,
      roomId: roomId
    });
  });

  // Quiz real-time session socket handlers
  socket.on('join_quiz_session', (data) => {
    const rawPin = data?.pin || data?.sessionId;
    const pin = rawPin ? rawPin.toString().replace(/\s+/g, '').trim() : null;
    if (!pin) return;
    const room = `quiz_${pin}`;
    socket.join(room);
    console.log(`[Socket] Socket ${socket.id} (${data?.nickname || 'Guest'}) joined quiz room ${room}`);

    const roomInfo = io.sockets.adapter.rooms.get(room);
    const count = roomInfo ? roomInfo.size : 1;
    io.to(room).emit('quiz_room_status', {
      pin,
      activeSockets: count,
    });
  });

  socket.on('leave_quiz_session', (data) => {
    const rawPin = data?.pin || data?.sessionId;
    const pin = rawPin ? rawPin.toString().replace(/\s+/g, '').trim() : null;
    if (!pin) return;
    const room = `quiz_${pin}`;
    socket.leave(room);
    console.log(`[Socket] Socket ${socket.id} left quiz room ${room}`);
  });

  socket.on('submit_quiz_answer', (data) => {
    const rawPin = data?.pin || data?.sessionId;
    const pin = rawPin ? rawPin.toString().replace(/\s+/g, '').trim() : null;
    if (!pin) return;
    const room = `quiz_${pin}`;
    // Broadcast live answer event so the host display can update the participant answer counter in real-time
    io.to(room).emit('answer_submitted', {
      pin,
      nickname: data?.nickname || 'Attendee',
      questionIndex: data?.questionIndex,
      optionIndex: data?.optionIndex ?? data?.answerIndex,
    });
  });

  // Admin projector confirms the question is rendered on screen.
  // Only then do we emit question_display to unlock attendee answer buttons.
  socket.on('admin_question_ready', (data) => {
    const rawPin = data?.pin;
    const pin = rawPin ? rawPin.toString().replace(/\s+/g, '').trim() : null;
    if (!pin) return;
    const room = `quiz_${pin}`;
    const payload = {
      pin,
      questionIndex: data?.questionIndex ?? 0,
      totalQuestions: data?.totalQuestions,
      currentQuestion: data?.currentQuestion ?? null,
      question: data?.question ?? null,
      options: data?.options ?? [],
      timeLimitSeconds: data?.timeLimitSeconds ?? 20,
      startedAt: data?.startedAt ?? Date.now(),
    };
    console.log(`[Socket] Admin question ready for PIN ${pin} Q${payload.questionIndex} — emitting question_display to ${room}`);
    io.to(room).emit('question_display', payload);
    io.to(pin).emit('question_display', payload);
  });

  socket.on('send_message', async (data) => {
    const { room, sender, content, type } = data;
    try {
      let isDirect = false;
      let roomDoc = null;

      if (mongoose.Types.ObjectId.isValid(room)) {
        roomDoc = await Room.findById(room);
        if (roomDoc) {
          isDirect = (roomDoc.isGroup === false || roomDoc.type === 'private');
        }
      }

      // Check-in gate for attendee sockets
      if (roomDoc && socket.attendee) {
        const { allowed, reason } = await assertAttendeeCheckedIn(
          socket.attendee.id,
          roomDoc.event.toString()
        );
        if (!allowed) {
          console.warn(`[Socket] Blocked un-checked-in attendee ${socket.attendee.id} from sending message in room ${room}`);
          socket.emit('chat_access_denied', { message: reason });
          return;
        }
      }

      const effectiveSender = socket.user?.id || socket.attendee?.id || sender;
      if (!effectiveSender) {
        socket.emit('error', { message: 'Authentication required to send message' });
        return;
      }

      // Check permission if it's a private direct message room
      if (isDirect && roomDoc) {
        const isParticipant = roomDoc.participantIds && roomDoc.participantIds.includes(String(effectiveSender));

        if (!isParticipant) {
          console.warn(`[Socket] Unauthorized send_message to private room ${room} by socket ${socket.id}`);
          socket.emit('error', { message: 'Unauthorized to send message to this private room' });
          return;
        }
      }

      // Check announcement room permission
      if (roomDoc && roomDoc.type === 'announcement') {
        let isOwner = false;
        if (socket.user) {
          const eventObj = await Event.findById(roomDoc.event);
          isOwner = Boolean(eventObj && eventObj.owner.toString() === socket.user.id);
        }
        if (!isOwner) {
          socket.emit('error', { message: 'Only event organizers can post in announcement channels' });
          return;
        }
      }

      const senderModel = socket.user ? 'User' : (socket.attendee ? 'Attendee' : 'User');

      // Resolve display name and avatar
      let finalSenderName = data.senderName;
      let finalSenderAvatar = data.senderAvatar;
      if (!finalSenderName) {
        if (socket.user) {
          const u = await User.findById(effectiveSender).select('firstName lastName orgName avatar');
          if (u) {
            finalSenderName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Organizer';
            finalSenderAvatar = u.avatar || null;
          }
        } else if (socket.attendee) {
          const a = await Attendee.findById(effectiveSender).select('name');
          if (a) finalSenderName = a.name;
        }
      }

      const newMessage = new Message({
        room,
        sender: effectiveSender,
        senderModel,
        senderName: finalSenderName,
        senderAvatar: finalSenderAvatar,
        content,
        type: type || 'user_message'
      });
      await newMessage.save();
      
      let populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name firstName lastName avatar');
      if (!populatedMessage?.sender || typeof populatedMessage.sender !== 'object') {
        populatedMessage = {
          ...populatedMessage.toObject(),
          sender: {
            _id: effectiveSender,
            id: effectiveSender,
            name: finalSenderName || 'User',
            avatar: finalSenderAvatar || null
          }
        };
      }

      io.to(room).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Error sending message via socket:', error);
    }
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          const count = room.size - 1;
          io.to(roomId).emit('room_status', {
            activated: count >= 2,
            count: count,
            roomId: roomId
          });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from base socket');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
