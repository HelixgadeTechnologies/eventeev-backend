const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const calendarController = require('../controllers/calendarController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @openapi
 * /api/calendar:
 *   get:
 *     tags: [Calendar]
 *     summary: Get all calendar events (Public)
 */
router.get('/', calendarController.getCalendarEvents);

/**
 * @openapi
 * /api/calendar:
 *   post:
 *     tags: [Calendar]
 *     summary: Submit a new calendar event
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('startDate', 'Start date is required').isISO8601(),
    check('startTime', 'Start time is required').not().isEmpty(),
    check('location', 'Location/Venue is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('type', 'Type must be virtual, hybrid, or in person').isIn(['virtual', 'hybrid', 'in person'])
  ],
  calendarController.createCalendarEvent
);

/**
 * @openapi
 * /api/calendar/admin:
 *   get:
 *     tags: [Calendar]
 *     summary: Admin listing for management
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin', auth, admin, calendarController.adminGetCalendarEvents);

/**
 * @openapi
 * /api/calendar/{id}:
 *   delete:
 *     tags: [Calendar]
 *     summary: Admin deletion of calendar event
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', auth, admin, calendarController.adminDeleteCalendarEvent);

module.exports = router;
