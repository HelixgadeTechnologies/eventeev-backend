// const mongoose = require("mongoose")
const Ticket = require("../models/ticket");
const Event = require("../models/event");

exports.createticket = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is missing or invalid." });
    }

    const {
      eventId,
      name,
      type,
      price,
      quantity,
      startDate,
      endDate,
      startTime,
      endTime,
    } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (quantity < 1)
      return res
        .status(400)
        .json({ error: "Ticket quantity must be at least 1" });

    const ticket = new Ticket({
      userId, // Add userId to track ticket creator
      eventId,
      name,
      type,
      price,
      quantity,
      remainingQuantity: quantity,
      startDate,
      endDate,
      startTime,
      endTime,
    });

    await ticket.save();
    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.geteventTickets = async (req, res) => {
  try {
    console.log(req.params);

    const { eventId } = req.params;

    if (!eventId) {
      return res
        .status(400)
        .json({ error: "Event ID is missing in the request" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const tickets = await Ticket.find({ eventId });

    if (tickets.length === 0) {
      return res
        .status(404)
        .json({ message: "No tickets found for this event" });
    }

    res
      .status(200)
      .json({ message: "Tickets retrieved successfully", tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editTicket = async (req, res) => {
  try {
    const userId = req.user?.userId;
    console.log(userId);
    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is missing or invalid." });
    }

    const { ticketId } = req.params;
    console.log("Requested Ticket ID:", ticketId);

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    console.log("Ticket Creator ID:", ticket.userId?.toString());

    // Ensure only the creator can edit
    if (ticket.userId?.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to edit this ticket" });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, req.body, {
      new: true,
    });

    res
      .status(200)
      .json({ message: "Ticket updated successfully", updatedTicket });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
