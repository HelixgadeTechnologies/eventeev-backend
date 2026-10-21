const Ticket = require('../models/Ticket');
const Attendee = require('../models/Attendee');
const Event = require('../models/Event');


/**
 * @desc    Create ticket
 * @route   POST /api/ticket/create
 * @access  Private
 */
exports.createTicket = async (req, res) => {
  const { eventId, name, type, price, suggestedAmount, quantity, startDate, startTime, endDate, endTime, description, status } = req.body;
  try {
    // Check ownership
    const event = await Event.findById(eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to create tickets for this event' });
    }

    const ticket = new Ticket({ eventId, name, type, price, suggestedAmount, quantity, startDate, startTime, endDate, endTime, description, status });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    console.error('[Create Ticket] Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Edit ticket
 * @route   PUT /api/ticket/edit/:id
 * @access  Private
 */
exports.editTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Check ownership
    const event = await Event.findById(ticket.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this ticket' });
    }

    const {
      name,
      type,
      price,
      suggestedAmount,
      quantity,
      startDate,
      startTime,
      endDate,
      endTime,
      description,
      status
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (price !== undefined) updateData.price = price;
    if (suggestedAmount !== undefined) updateData.suggestedAmount = suggestedAmount;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    res.json(updatedTicket);

  } catch (error) {
    console.error('[Edit Ticket] Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Delete ticket
 * @route   DELETE /api/ticket/:id
 * @access  Private
 */
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Check ownership
    const event = await Event.findById(ticket.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this ticket' });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket tier removed' });

  } catch (error) {
    console.error('[Delete Ticket] Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Update ticket status
 * @route   PATCH /api/ticket/:id/status
 * @access  Private
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Check ownership
    const event = await Event.findById(ticket.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this ticket status' });
    }

    const { status } = req.body;
    const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updatedTicket);

  } catch (error) {
    console.error('[Update Ticket Status] Error:', error);
    res.status(500).json({ message: 'Server Error' });
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
    console.error('[Get Tickets By Event] Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Get attendees for ticket tier
 * @route   GET /api/ticket/attendees/:ticketId
 * @access  Private
 */
exports.getAttendeesByTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) return res.status(404).json({ message: 'Ticket tier not found' });

    // Check ownership
    const event = await Event.findById(ticket.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to access this tier\'s attendees' });
    }

    const attendees = await Attendee.find({ ticketId: req.params.ticketId });
    res.json(attendees);

  } catch (error) {
    console.error('[Get Attendees By Ticket] Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
