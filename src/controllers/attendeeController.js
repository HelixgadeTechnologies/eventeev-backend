const Attendee = require('../models/Attendee');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const Event = require('../models/Event');

const Ticket = require('../models/Ticket');
const { createNotification } = require('./notificationController');
const sendEmail = require('../utils/sendEmail');
const { generateRegistrationEmail } = require('../utils/registrationTemplate');
const { generateTicketPDF } = require('../utils/pdfGenerator');
const mongoose = require('mongoose');
const User = require('../models/User');
const CalendarEvent = require('../models/CalendarEvent');
const { addEventToGoogleCalendar } = require('../utils/googleCalendar');


/**
 * Helper to sync event to attendee's calendar if they have an account
 */
const syncToCalendar = async (email, event) => {
  try {
    const user = await User.findOne({ email }).select('+googleRefreshToken');
    if (!user) {
      console.log(`[Calendar Sync] No user account found for email: ${email}. Skipping calendar entry.`);
      return;
    }

    // 1. Local Database Sync (Internal Calendar Feature)
    const existingEntry = await CalendarEvent.findOne({ 
      owner: user._id, 
      originalEventId: event._id 
    });

    if (!existingEntry) {
      const calendarEvent = new CalendarEvent({
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        category: event.category,
        type: event.type,
        owner: user._id,
        originalEventId: event._id,
        isRegistrationEntry: true
      });
      await calendarEvent.save();
      console.log(`[Calendar Sync] Event "${event.title}" synced to internal calendar for user: ${email}`);
    }

    // 2. Google Calendar Sync
    if (user.googleRefreshToken) {
      console.log(`[Google Calendar Sync] Attempting to sync event "${event.title}" for ${email}`);
      await addEventToGoogleCalendar(user, event);
    }
  } catch (err) {
    console.error(`[Calendar Sync] Error syncing event to calendar for ${email}:`, err.message);
  }
};



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

    // 5. Sync to Calendar (If user exists)
    await syncToCalendar(email, event);

    // 6. Notify Organiser
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
 * @desc    Google registration for an event
 * @route   POST /api/attendee/google-register
 * @access  Public
 */
exports.googleRegisterAttendee = async (req, res) => {
  const { eventId, idToken, ticketId } = req.body;

  try {
    // 1. Verify Google ID Token
    const ticketObj = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticketObj.getPayload();
    const { sub: googleId, email, name } = payload;

    // 2. Validate Event existence and status
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'Published') {
      return res.status(400).json({ message: 'Registration is not open for this event' });
    }

    // 3. Prevent duplicate registrations for same email + event
    const existingRegistration = await Attendee.findOne({ eventId, email });
    if (existingRegistration) {
      return res.status(400).json({ message: 'You have already registered for this event' });
    }

    // 4. Validate Ticket and Quantity
    let ticket = null;
    if (ticketId) {
      ticket = await Ticket.findOneAndUpdate(
        { _id: ticketId, eventId, quantity: { $gt: 0 } },
        { $inc: { quantity: -1 } },
        { new: true }
      );

      if (!ticket) {
        return res.status(400).json({ message: 'Ticket is sold out or invalid' });
      }

      if (ticket.quantity === 0) {
        ticket.status = 'Sold Out';
        await ticket.save();
      }
    }

    // 5. Create Attendee
    const attendeeId = new mongoose.Types.ObjectId();
    const orderId = `REG-G-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${attendeeId}`;
    
    const attendee = new Attendee({
      _id: attendeeId,
      eventId,
      ticketId,
      name,
      email,
      googleId,
      orderId,
      qrCode: qrCodeUrl,
      status: 'pending'
    });

    await attendee.save();

    // 6. Sync to Calendar (If user exists)
    await syncToCalendar(email, event);

    // 7. Notify Organiser
    await createNotification({
      recipient: event.owner,
      type: 'ticket',
      title: 'New Google Registration!',
      message: `${name} has just registered via Google for your event: ${event.title}`,
      link: `/events/${event._id}/attendees`
    });

    // 7. Send Registration Email
    try {
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
      console.error('[Google Register Attendee] Registration email sending error:', emailErr);
    }

    res.status(201).json(attendee);
  } catch (error) {
    console.error('[Google Register Attendee] Error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
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

    // Check if user owns the event
    const event = await Event.findById(req.params.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to access this event\'s attendees' });
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
    // Check if user owns the event
    const event = await Event.findById(req.params.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to access this event\'s statistics' });
    }

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

    // Check if user owns the event
    const event = await Event.findById(attendee.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to check-in this attendee' });
    }


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

    // Check if user owns the event
    const event = await Event.findById(eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to create attendees for this event' });
    }


    const attendeeId = new mongoose.Types.ObjectId();
    const orderId = `CK-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${attendeeId}`;

    const attendee = new Attendee({ ...req.body, _id: attendeeId, orderId, qrCode: qrCodeUrl });
    await attendee.save();

    // Sync to Calendar (If user exists)
    await syncToCalendar(email, event);

    // Send order confirmation email
    try {
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
    const attendee = await Attendee.findById(req.params.id);
    if (!attendee) return res.status(404).json({ message: 'Attendee not found' });

    // Check if user owns the event
    const event = await Event.findById(attendee.eventId);
    if (!event || event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this attendee' });
    }

    await Attendee.findByIdAndDelete(req.params.id);

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

