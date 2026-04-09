const Ticket = require('../models/Ticket');
const Attendee = require('../models/Attendee');

/**
 * @desc    Create ticket
 * @route   POST /api/ticket/create
 * @access  Private
 */
exports.createTicket = async (req, res) => {
  const { eventId, name, type, price, suggestedAmount, quantity, startDate, startTime, endDate, endTime, description, status } = req.body;
  try {
    const ticket = new Ticket({ eventId, name, type, price, suggestedAmount, quantity, startDate, startTime, endDate, endTime, description, status });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Edit ticket
 * @route   PUT /api/ticket/edit/:id
 * @access  Private
 */
exports.editTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete ticket
 * @route   DELETE /api/ticket/:id
 * @access  Private
 */
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ message: 'Ticket tier removed' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update ticket status
 * @route   PATCH /api/ticket/:id/status
 * @access  Private
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get tickets for event
 * @route   GET /api/ticket/event/:eventId
 * @access  Public
 */
exports.getTicketsByEvent = async (req, res) => {
  try {
    const tickets = await Ticket.find({ eventId: req.params.eventId });
    res.json(tickets);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get attendees for ticket tier
 * @route   GET /api/ticket/attendees/:ticketId
 * @access  Private
 */
exports.getAttendeesByTicket = async (req, res) => {
  try {
    const attendees = await Attendee.find({ ticketId: req.params.ticketId });
    res.json(attendees);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
