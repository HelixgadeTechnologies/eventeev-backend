const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Basic Route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Eventeev API", status: "healthy" });
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
