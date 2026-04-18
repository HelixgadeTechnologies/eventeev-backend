require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const app = require('./app');
const Message = require('./models/Message');
const startEventStatusTask = require('./tasks/statusTask');

// Connect Database
connectDB();

// Start Background Tasks
startEventStatusTask();

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI', 'JWT_EXPIRES_IN', 'EMAIL_USER', 'EMAIL_APP_PASS'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('[CRITICAL] Missing required environment variables:', missingEnvVars.join(', '));
  console.error('[CRITICAL] Authentication and Database features may fail!');
} else {
  console.log('[SUCCESS] All required environment variables are present.');
}

const { initSocket } = require('./utils/socket');
const server = http.createServer(app);
const io = initSocket(server);

// socket.js handles the connection and notification rooms.
// We'll keep the message logic here for now, but use the io instance from initSocket.
io.on('connection', (socket) => {
  console.log('User connected to base socket:', socket.id);

  socket.on('join_room', (roomId) => {
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

  socket.on('send_message', async (data) => {
    const { room, sender, content, type } = data;
    try {
      const newMessage = new Message({
        room,
        sender,
        content,
        type
      });
      await newMessage.save();
      
      const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name avatar');
      io.to(room).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Error sending message via socket:', error);
    }
  });

  socket.on('disconnecting', () => {
    // Before actual disconnect, we can see which rooms the socket was in
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) { // ignore the auto-generated room for this socket
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          const count = room.size - 1; // current size including this socket which is about to leave
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
