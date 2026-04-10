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
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI', 'JWT_EXPIRES_IN'];
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
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
