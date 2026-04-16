const express = require('express');
const router = express.Router();
const attendeeController = require('../controllers/attendeeController');

/**
 * @openapi
 * /api/attendee/event/{eventId}:
 *   get:
 *     tags: [Attendees]
 *     summary: Get all attendees for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attendee'
 */
router.get('/event/:eventId', attendeeController.getAttendeesByEvent);

/**
 * @openapi
 * /api/attendee/event/{eventId}/stats:
 *   get:
 *     tags: [Attendees]
 *     summary: Get attendee statistics for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/event/:eventId/stats', attendeeController.getAttendeeStats);

/**
 * @openapi
 * /api/attendee/{id}/check-in:
 *   patch:
 *     tags: [Attendees]
 *     summary: Check-in an attendee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Check-in successful
 */
router.patch('/:id/check-in', attendeeController.checkInAttendee);

/**
 * @openapi
 * /api/attendee/create:
 *   post:
 *     tags: [Attendees]
 *     summary: Create a new attendee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attendee'
 *     responses:
 *       201:
 *         description: Attendee created
 */
router.post('/create', attendeeController.createAttendee);

/**
 * @openapi
 * /api/attendee/{id}:
 *   delete:
 *     tags: [Attendees]
 *     summary: Delete an attendee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendee deleted
 */
router.delete('/:id', attendeeController.deleteAttendee);

/**
 * @openapi
 * /api/attendee/register:
 *   post:
 *     tags: [Attendees]
 *     summary: Public registration for an event (unauthenticated)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, name, email]
 *             properties:
 *               eventId: { type: string }
 *               name: { type: string }
 *               email: { type: string }
 *               ticketId: { type: string }
 *     responses:
 *       201:
 *         description: Successfully registered
 *       400:
 *         description: Already registered or Sold out
 */
router.post('/register', attendeeController.registerAttendee);

/**
 * @openapi
 * /api/attendee/ticket/{id}/download:
 *   get:
 *     tags: [Attendees]
 *     summary: Download ticket as PDF
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file returned
 *       404:
 *         description: Attendee or Event not found
 */
router.get('/ticket/:id/download', attendeeController.downloadTicketPDF);

module.exports = router;

