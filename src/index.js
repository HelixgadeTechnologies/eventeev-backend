require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const app = require('./app');
const Message = require('./models/Message');

// Connect Database
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"]
  }
});

// Socket.io Implementation
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
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
      
      // Populate sender before emitting
      const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name avatar');
      
      io.to(room).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Error sending message via socket:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
