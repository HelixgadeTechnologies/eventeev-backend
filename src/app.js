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

// Allowed frontend origins
const defaultAllowedOrigins = [
  'https://eventeev.com',
  'https://www.eventeev.com',
  'https://app.eventeev.com',
  'https://fun.eventeev.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];

const envOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow known origins or wildcard
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.FRONTEND_URL === '*') {
      return callback(null, true);
    }

    // Allow all eventeev.com subdomains and local development
    if (
      origin.endsWith('.eventeev.com') ||
      origin === 'https://eventeev.com' ||
      origin === 'http://eventeev.com' ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }

    // Allow by default to prevent blocking valid public client requests
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(morgan("dev"));

// Global Rate Limiting (generous ceiling for active attendees on venue WiFi)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Sufficient for multi-attendee venue NATs and live polling
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for real-time game polling and API documentation
    return req.path.startsWith('/api/game/quiz/session') || req.path.startsWith('/api-docs');
  },
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
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
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
app.use('/api/payment', require('./routes/payment'));
app.use('/api/networking', require('./routes/networking'));

const Sentry = require('@sentry/node');
Sentry.setupExpressErrorHandler(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(err.errors).map(val => val.message) });
  }
  
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Unauthorized Access' });
  }

  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong!';
  
  res.status(status).json({ 
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
