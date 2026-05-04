const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(helmet());

// Restrict CORS to specific frontend origin
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Fallback to all for now if env is missing, but env should have it
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(morgan("dev"));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Specific Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 attempts per 10 mins
  message: { message: "Too many login attempts, please try again after 10 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgotpassword', authLimiter);
app.use(express.json());
app.use(express.static('public'));

// Basic Route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Eventeev API", status: "healthy" });
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/event', require('./routes/event'));
app.use('/api/ticket', require('./routes/ticket'));
app.use('/api/user', require('./routes/user'));
app.use('/api/speaker', require('./routes/speaker'));
app.use('/api/game', require('./routes/game'));
app.use('/api/attendee', require('./routes/attendee'));
app.use('/api/poll', require('./routes/poll'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/link', require('./routes/link'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notification', require('./routes/notification'));
app.use('/api/support', require('./routes/support'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
