const express = require('express');
const router = express.Router();
const attendeeController = require('../controllers/attendeeController');
const auth = require('../middleware/auth');


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
router.get('/event/:eventId', auth, attendeeController.getAttendeesByEvent);

/**
 * @openapi
 * /api/attendee/event/{eventId}/paid:
 *   get:
 *     tags: [Attendees]
 *     summary: Get all paid attendees for an event
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
router.get('/event/:eventId/paid', auth, attendeeController.getPaidAttendeesByEvent);

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
router.get('/event/:eventId/stats', auth, attendeeController.getAttendeeStats);

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
router.patch('/:id/check-in', auth, attendeeController.checkInAttendee);

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
router.post('/create', auth, attendeeController.createAttendee);

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
router.delete('/:id', auth, attendeeController.deleteAttendee);

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
 * /api/attendee/google-register:
 *   post:
 *     tags: [Attendees]
 *     summary: Public registration for an event via Google (unauthenticated)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, idToken]
 *             properties:
 *               eventId: { type: string }
 *               idToken: { type: string }
 *               ticketId: { type: string }
 *     responses:
 *       201:
 *         description: Successfully registered
 *       400:
 *         description: Already registered or Sold out
 *       401:
 *         description: Invalid Google token
 */
router.post('/google-register', attendeeController.googleRegisterAttendee);


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

/**
 * @openapi
 * /api/attendee/ticket/{id}/whatsapp:
 *   get:
 *     tags: [Attendees]
 *     summary: 1-Click WhatsApp Ticket Share (redirects or returns link)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: phone
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional recipient phone number in international format
 *       - in: query
 *         name: json
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Set to true to return JSON with whatsappUrl instead of redirecting
 *     responses:
 *       302:
 *         description: Redirects to WhatsApp with pre-filled ticket details
 *       200:
 *         description: Returns JSON with whatsappUrl
 *       404:
 *         description: Attendee or Event not found
 */
router.get('/ticket/:id/whatsapp', attendeeController.redirectToWhatsAppTicket);

const attendeeAuth = require('../middleware/attendeeAuth');

/**
 * @openapi
 * /api/attendee/login:
 *   post:
 *     tags: [Attendees]
 *     summary: Login for an attendee using Email and Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, orderId]
 *             properties:
 *               email: { type: string }
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', attendeeController.loginAttendee);

/**
 * @openapi
 * /api/attendee/google-login:
 *   post:
 *     tags: [Attendees]
 *     summary: Login an attendee using Google ID token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns token and attendee
 *       400:
 *         description: Invalid Google token
 *       404:
 *         description: No attendee registration found
 */
router.post('/google-login', attendeeController.googleLoginAttendee);

/**
 * @openapi
 * /api/attendee/me:
 *   get:
 *     tags: [Attendees]
 *     summary: Get current authenticated attendee profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendee profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', attendeeAuth, attendeeController.getAttendeeMe);
router.post('/check-in-self', attendeeAuth, attendeeController.checkInSelf);

/**
 * @openapi
 * /api/attendee/my-events:
 *   get:
 *     tags: [Attendees]
 *     summary: Get all events registered by the authenticated attendee
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attendee records with event details
 */
router.get('/my-events', attendeeAuth, attendeeController.getMyEvents);

/**
 * @openapi
 * /api/attendee/resend-confirmation:
 *   post:
 *     tags: [Attendees]
 *     summary: Resend registration confirmation email to an attendee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               eventId: { type: string }
 *               orderId: { type: string }
 *               paymentReference: { type: string }
 *     responses:
 *       200:
 *         description: Confirmation email sent successfully
 *       404:
 *         description: Attendee record not found
 */
router.post('/resend-confirmation', attendeeController.resendConfirmationEmail);

/**
 * @openapi
 * /api/attendee/email-status:
 *   get:
 *     tags: [Attendees]
 *     summary: Check active email transport provider
 *     responses:
 *       200:
 *         description: Active provider status
 */
router.get('/email-status', attendeeController.getEmailProviderStatus);

module.exports = router;

