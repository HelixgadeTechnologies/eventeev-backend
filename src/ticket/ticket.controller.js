// const mongoose = require("mongoose")
const Ticket = require("../models/ticket");
const Event = require("../models/event");
const QRCode = require("qrcode");
const crypto = require("crypto");
const Attendee = require("../models/attendee");
const nodemailer = require("nodemailer");
const fs = require("fs")

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

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


exports.purchaseticket = async (req, res) => {
  try {
    const { eventId, ticketId, fullname, email } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const ticketCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Generate QR Code (content: ticket details)
    const qrData = `${fullname} | ${email} | Ticket Code: ${ticketCode}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    const attendee = new Attendee({
      eventId,
      ticketId,
      fullname,
      email,
      ticketCode,
      qrCode: qrCodeUrl,
    });

    await attendee.save();

    // Send email with ticket
    await sendTicketEmail(email, fullname, ticketCode, qrCodeUrl);

    res.status(201).json({
      message: "Ticket purchased successfully",
      attendee,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function sendTicketEmail(email, fullname, ticketCode, qrCodeUrl) {
  // Generate QR Code and save as a file
  const qrFilePath = `./temp/qrcode-${ticketCode}.png`;
  await QRCode.toFile(qrFilePath, `${fullname} | ${email} | Ticket Code: ${ticketCode}`);

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Your Event Ticket",
    html: `
      <h3>Hello ${fullname},</h3>
      <p>Your ticket has been successfully booked!</p>
      <p><strong>Ticket Code:</strong> ${ticketCode}</p>
      <p>Scan the attached QR code at check-in.</p>
      <p>See you at the event!</p>
    `,
    attachments: [
      {
        filename: `Ticket-${ticketCode}.png`,
        path: qrFilePath,
        cid: "qrcodecid", // This allows embedding in HTML
      },
    ],
  };

  await transporter.sendMail(mailOptions);

  // Delete the QR code file after sending email
  fs.unlink(qrFilePath, (err) => {
    if (err) console.error("Error deleting QR code file:", err);
  });
}

exports.checkin = async (req, res) => {
  try {
    const { ticketCode } = req.body;

    // Find attendee by ticket code
    const attendee = await Attendee.findOne({ ticketCode });

    if (!attendee) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (attendee.ischeckedin) {
      return res.status(400).json({ error: "Attendee already checked in" });
    }

    attendee.ischeckedin = true;
    await attendee.save();

    res.status(200).json({ message: "Check-in successful", attendee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getattendeesbyticket = async (req, res) => {
  try {
    const { eventId, ticketId } = req.params;

    if (!eventId || !ticketId) {
      return res.status(400).json({ error: "Event ID and Ticket ID are required" });
    }

    // Find attendees that match both eventId and ticketId
    const attendees = await Attendee.find({ eventId, ticketId });

    if (attendees.length === 0) {
      return res.status(404).json({ message: "No attendees found for this ticket" });
    }

    res.status(200).json({ message: "Attendees retrieved successfully", attendees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

