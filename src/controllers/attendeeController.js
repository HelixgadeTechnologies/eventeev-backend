const Attendee = require('../models/Attendee');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { createNotification } = require('./notificationController');
const sendEmail = require('../utils/sendEmail');
const { generateRegistrationEmail } = require('../utils/registrationTemplate');
const { generateTicketPDF } = require('../utils/pdfGenerator');
const mongoose = require('mongoose');



/**
 * @desc    Public registration for an event
 * @route   POST /api/attendee/register
 * @access  Public
 */
exports.registerAttendee = async (req, res) => {
  const { eventId, name, email, ticketId } = req.body;

  try {
    // 1. Validate Event existence and status
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'Published') {
      return res.status(400).json({ message: 'Registration is not open for this event' });
    }

    // 2. Prevent duplicate registrations for same email + event
    const existingRegistration = await Attendee.findOne({ eventId, email });
    if (existingRegistration) {
      return res.status(400).json({ message: 'You have already registered for this event' });
    }

    // 3. Validate Ticket and Quantity
    let ticket = null;
    if (ticketId) {
      // Use atomic update to decrement quantity only if it is > 0
      ticket = await Ticket.findOneAndUpdate(
        { _id: ticketId, eventId, quantity: { $gt: 0 } },
        { $inc: { quantity: -1 } },
        { new: true }
      );

      if (!ticket) {
        return res.status(400).json({ message: 'Ticket is sold out or invalid' });
      }

      // Automatically mark as "Sold Out" if count hits 0
      if (ticket.quantity === 0) {
        ticket.status = 'Sold Out';
        await ticket.save();
      }
    }

    // 4. Create Attendee
    const attendeeId = new mongoose.Types.ObjectId();
    const orderId = `REG-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${attendeeId}`;
    
    const attendee = new Attendee({
      _id: attendeeId,
      eventId,
      ticketId,
      name,
      email,
      orderId,
      qrCode: qrCodeUrl,
      status: 'pending'
    });

    await attendee.save();

    // 5. Notify Organiser
    await createNotification({
      recipient: event.owner,
      type: 'ticket',
      title: 'New Registration!',
      message: `${name} has just registered for your event: ${event.title}`,
      link: `/events/${event._id}/attendees`
    });

    // 6. Send Registration Email to Attendee
    try {
      const eventDate = new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const ticketType = ticket ? ticket.name : 'General Admission';
      const amountPaid = ticket && ticket.price ? `$${ticket.price}` : 'Free';

      const htmlTemplate = generateRegistrationEmail({
        name,
        event,
        ticketType,
        orderId,
        qrCodeUrl,
        amountPaid,
        attendeeId: attendee._id
      });


      await sendEmail({
        email: email,
        subject: `You’re In! Confirmation for ${event.title}`,
        html: htmlTemplate
      });

    } catch (emailErr) {
      console.error('[Register Attendee] Registration email sending error:', emailErr);
    }

    res.status(201).json(attendee);
  } catch (error) {
    console.error('[Register Attendee] Error:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all attendees for an event
 * @route   GET /api/attendee/event/:eventId
 * @access  Private
 */
exports.getAttendeesByEvent = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = { eventId: req.params.eventId };

    if (status && status !== 'All') {
      query.status = status.toLowerCase();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const attendees = await Attendee.find(query).sort({ registrationDate: -1 });
    res.json(attendees);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get attendee stats for an event
 * @route   GET /api/attendee/event/:eventId/stats
 * @access  Private
 */
exports.getAttendeeStats = async (req, res) => {
  try {
    const totalAttendees = await Attendee.countDocuments({ eventId: req.params.eventId });
    const verifiedAccess = await Attendee.countDocuments({ eventId: req.params.eventId, isCheckedIn: true });
    
    // Recent activity (e.g., check-ins in the last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentActivity = await Attendee.countDocuments({
      eventId: req.params.eventId,
      isCheckedIn: true,
      checkInTime: { $gte: thirtyMinutesAgo }
    });

    res.json({
      totalAttendees,
      verifiedAccess,
      recentActivity
    });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Check-in attendee (Toggle status)
 * @route   PATCH /api/attendee/:id/check-in
 * @access  Private
 */
exports.checkInAttendee = async (req, res) => {
  try {
    const attendee = await Attendee.findById(req.params.id);
    if (!attendee) return res.status(404).json({ message: 'Attendee not found' });

    attendee.isCheckedIn = !attendee.isCheckedIn;
    attendee.status = attendee.isCheckedIn ? 'verified' : 'pending';
    attendee.checkInTime = attendee.isCheckedIn ? new Date() : null;

    await attendee.save();
    res.json(attendee);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Create attendee (Manual registration)
 * @route   POST /api/attendee/create
 * @access  Private
 */
exports.createAttendee = async (req, res) => {
  try {
    const { eventId, name, email, ticketId } = req.body;

    const attendeeId = new mongoose.Types.ObjectId();
    const orderId = `CK-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${attendeeId}`;

    const attendee = new Attendee({ ...req.body, _id: attendeeId, orderId, qrCode: qrCodeUrl });
    await attendee.save();

    // Send order confirmation email
    try {
      const event = await Event.findById(eventId);
      let ticket = null;
      if (ticketId) {
        ticket = await Ticket.findById(ticketId);
      }

      if (event) {
        const eventDate = new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const ticketType = ticket ? ticket.name : 'General Admission';
        const amountPaid = ticket && ticket.price ? `$${ticket.price}` : 'Free';

        const htmlTemplate = generateRegistrationEmail({
          name,
          event,
          ticketType,
          orderId,
          qrCodeUrl,
          amountPaid,
          attendeeId: attendee._id
        });


        await sendEmail({
          email: email,
          subject: `You're In! Confirmation for ${event.title}`,
          html: htmlTemplate
        });

      }
    } catch (emailErr) {
      console.error('[Create Attendee] Confirmation email error:', emailErr);
    }

    res.status(201).json(attendee);
  } catch (error) {
    console.error('[Create Attendee] Error:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete attendee
 * @route   DELETE /api/attendee/:id
 * @access  Private
 */
exports.deleteAttendee = async (req, res) => {
  try {
    const attendee = await Attendee.findByIdAndDelete(req.params.id);
    if (!attendee) return res.status(404).json({ message: 'Attendee not found' });
    res.json({ message: 'Attendee removed' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Download ticket as PDF
 * @route   GET /api/attendee/ticket/:id/download
 * @access  Public
 */
exports.downloadTicketPDF = async (req, res) => {
  try {
    const attendee = await Attendee.findById(req.params.id);
    if (!attendee) {
      return res.status(404).json({ message: 'Attendee not found' });
    }

    const event = await Event.findById(attendee.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let ticketType = 'General Admission';
    if (attendee.ticketId) {
      const ticket = await Ticket.findById(attendee.ticketId);
      if (ticket) ticketType = ticket.name;
    }

    const pdfBuffer = await generateTicketPDF({
      attendee,
      event,
      ticketType
    });

    // Clean filename: AttendeeName-Ticket-OrderID.pdf
    const safeName = attendee.name.replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeName}-Ticket-${attendee.orderId}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('[Download Ticket PDF] Error:', error);
    res.status(500).send('Error generating PDF');
  }
};

