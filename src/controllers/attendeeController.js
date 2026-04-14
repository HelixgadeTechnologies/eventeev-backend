const Attendee = require('../models/Attendee');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { createNotification } = require('./notificationController');
const sendEmail = require('../utils/sendEmail');
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

      await sendEmail({
        email: email,
        subject: `You’re In! Confirmation for ${event.title}`,
        message: `Hi ${name},\nGreat news! Your registration for ${event.title} is confirmed. We’ve saved a spot just for you, and we can’t wait to see you there.\n\nEvent Details\nEvent: ${event.title}\nDate: ${eventDate}\nTime: ${event.startTime || 'TBD'}\nLocation: ${event.location || 'Online'}\n\nYour Entry Ticket\nAttached to this email is your digital ticket. Please have the QR code ready on your phone or printed out for a smooth check-in at the door.\n\nOrder Summary:\nOrder ID: #${orderId}\nTicket Type: ${ticketType}\nTotal Paid: ${amountPaid}\n\n[Add to Calendar] | [View Event Page]\nManage your registration:\nIf you need to update your details or can no longer attend, you can manage your ticket through your eventeev Attendee Portal.\n\nSee you soon!\nThe ${event.title} Team\nPowered by eventeev`,
        html: `<p>Hi ${name},</p>
<p>Great news! Your registration for <strong>${event.title}</strong> is confirmed. We’ve saved a spot just for you, and we can’t wait to see you there.</p>
<h3>Event Details</h3>
<ul>
  <li><strong>Event:</strong> ${event.title}</li>
  <li><strong>Date:</strong> ${eventDate}</li>
  <li><strong>Time:</strong> ${event.startTime || 'TBD'}</li>
  <li><strong>Location:</strong> ${event.location || 'Online'}</li>
</ul>
<h3>Your Entry Ticket</h3>
<p>Attached to this email is your digital ticket. Please have the QR code ready on your phone or printed out for a smooth check-in at the door.</p>
<p><img src="${qrCodeUrl}" alt="QR Code" /></p>
<h3>Order Summary</h3>
<ul>
  <li><strong>Order ID:</strong> #${orderId}</li>
  <li><strong>Ticket Type:</strong> ${ticketType}</li>
  <li><strong>Total Paid:</strong> ${amountPaid}</li>
</ul>
<p>[Add to Calendar] | [View Event Page]</p>
<p><strong>Manage your registration:</strong><br>
If you need to update your details or can no longer attend, you can manage your ticket through your eventeev Attendee Portal.</p>
<p>See you soon!<br>
The ${event.title} Team<br>
<em>Powered by eventeev</em></p>`
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
    const attendeeId = new mongoose.Types.ObjectId();
    const orderId = `CK-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${attendeeId}`;
    const attendee = new Attendee({ ...req.body, _id: attendeeId, orderId, qrCode: qrCodeUrl });
    await attendee.save();
    res.status(201).json(attendee);
  } catch (error) {
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
