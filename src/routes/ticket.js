const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

/**
 * @openapi
 * /api/ticket/create:
 *   post:
 *     tags: [Tickets]
 *     summary: Create a new ticket tier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ticket'
 *     responses:
 *       201:
 *         description: Ticket created
 */
router.post('/create', ticketController.createTicket);

/**
 * @openapi
 * /api/ticket/edit/{id}:
 *   put:
 *     tags: [Tickets]
 *     summary: Edit ticket tier details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ticket'
 *     responses:
 *       200:
 *         description: Ticket updated
 */
router.put('/edit/:id', ticketController.editTicket);

/**
 * @openapi
 * /api/ticket/event/{eventId}:
 *   get:
 *     tags: [Tickets]
 *     summary: Get all tickets for an event
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
 *                 $ref: '#/components/schemas/Ticket'
 */
router.get('/event/:eventId', ticketController.getTicketsByEvent);

/**
 * @openapi
 * /api/ticket/{id}:
 *   delete:
 *     tags: [Tickets]
 *     summary: Delete a ticket tier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket deleted
 */
router.delete('/:id', ticketController.deleteTicket);

/**
 * @openapi
 * /api/ticket/{id}/status:
 *   patch:
 *     tags: [Tickets]
 *     summary: Update ticket status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [Active, Inactive, Sold Out] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', ticketController.updateTicketStatus);

/**
 * @openapi
 * /api/ticket/attendees/{ticketId}:
 *   get:
 *     tags: [Tickets]
 *     summary: Get all attendees for a specific ticket tier
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/attendees/:ticketId', ticketController.getAttendeesByTicket);

module.exports = router;
