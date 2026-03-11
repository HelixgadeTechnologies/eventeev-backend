const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.post('/create', ticketController.createTicket);
router.put('/edit/:id', ticketController.editTicket);
router.get('/event/:eventId', ticketController.getTicketsByEvent);
router.delete('/:id', ticketController.deleteTicket);
router.patch('/:id/status', ticketController.updateTicketStatus);
router.get('/attendees/:ticketId', ticketController.getAttendeesByTicket);

module.exports = router;
