const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Speaker = require('../models/Speaker');
const Schedule = require('../models/Schedule');
const Room = require('../models/Room');
const User = require('../models/User');
const { addEventToGoogleCalendar } = require('../utils/googleCalendar');
const { isEventExpired } = require('../utils/eventStatus');

/**
 * @desc    Helper to ensure a General Lobby exists for an event
 */
const ensureGeneralLobby = async (eventId) => {
  try {
    const existingRoom = await Room.findOne({ event: eventId, name: 'General Lobby' });
    if (!existingRoom) {
      const room = new Room({
        event: eventId,
        name: 'General Lobby',
        type: 'public'
      });
      await room.save();
      console.log(`[Chat] General Lobby created for event ${eventId}`);
    }
  } catch (error) {
    console.error(`[Chat] Error creating General Lobby for event ${eventId}:`, error);
  }
};


/**
 * @desc    Get public event details by slug
 * @route   GET /api/event/public/:slug
 * @access  Public
 */
exports.getPublicEventBySlug = async (req, res) => {
  try {
    // Try finding by slug first
    let event = await Event.findOne({ slug: req.params.slug, status: 'Published' });
    
    // Fallback: Try finding by ID if no slug matches (useful for legacy events)
    if (!event && req.params.slug.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findOne({ _id: req.params.slug, status: 'Published' });
    }

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Fetch associated data
    const tickets = await Ticket.find({ eventId: event._id, status: 'Active' });
    const speakers = await Speaker.find({ eventId: event._id });
    const schedule = await Schedule.find({ event: event._id }).sort({ startTime: 1 });

    // Construct response with shareable URL (fallback to ID if slug is missing)
    const publicUrl = `${process.env.FRONTEND_URL || 'https://eventeev.com'}/${event.slug || event._id}`;

    res.json({
      ...event._doc,
      publicUrl,
      tickets,
      speakers,
      schedule
    });
  } catch (error) {
    console.error('[Get Public Event By Slug] Error:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all published events
 * @route   GET /api/event/published
 * @access  Public
 */
exports.getPublishedEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'Published' });
    
    // Check for expiration on-the-fly to ensure UI accuracy
    const updatedEvents = [];
    for (const event of events) {
      if (isEventExpired(event)) {
        event.status = 'Completed';
        await event.save();
      } else {
        updatedEvents.push(event);
      }
    }

    res.json(updatedEvents);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};


/**
 * @desc    Get event listing for landing page (Upcoming published events)
 * @route   GET /api/event/listing
 * @access  Public
 */
exports.getEventListing = async (req, res) => {
  try {
    const { category, duration } = req.query;
    const now = new Date();
    
    // Base query: Only published and upcoming events
    const query = { 
      status: 'Published', 
      startDate: { $gte: now } 
    };

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Filter by duration if provided
    if (duration === 'week') {
      const endOfWeek = new Date(now);
      // Get the end of the current week (Sunday)
      const diff = 7 - (now.getDay() === 0 ? 7 : now.getDay());
      endOfWeek.setDate(now.getDate() + diff);
      endOfWeek.setHours(23, 59, 59, 999);
      query.startDate.$lte = endOfWeek;
    } else if (duration === 'month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      query.startDate.$lte = endOfMonth;
    }

    const events = await Event.find(query).sort({ startDate: 1 });
    
    // Check for expiration on-the-fly
    const updatedEvents = [];
    for (const event of events) {
      if (isEventExpired(event)) {
        event.status = 'Completed';
        await event.save();
      } else {
        updatedEvents.push(event);
      }
    }

    res.json(updatedEvents);

  } catch (error) {
    console.error('[Get Event Listing] Error:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get drafts
 * @route   GET /api/event/drafts
 * @access  Private
 */
exports.getDrafts = async (req, res) => {
  try {
    const events = await Event.find({ owner: req.user.id, status: 'Draft' });

    res.json(events);

  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get completed events
 * @route   GET /api/event/completed
 * @access  Private
 */
exports.getCompletedEvents = async (req, res) => {
  try {
    const events = await Event.find({ owner: req.user.id, status: 'Completed' });

    res.json(events);

  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Publish event
 * @route   POST /api/event/publish
 * @access  Private
 */
exports.publishEvent = async (req, res) => {
  // 1. Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    title, 
    description, 
    category, 
    type, 
    startDate, 
    endDate,
    startTime, 
    endTime,
    location, 
    bannerImage, 
    thumbnailImage,
    website,
    facebookUrl,
    instagramUrl,
    xUrl,
    recurrentEvent,
    status 
  } = req.body;

  try {
    const event = new Event({
      owner: req.user.id,
      title,
      description,
      category,
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      bannerImage,
      thumbnailImage,
      website,
      facebookUrl,
      instagramUrl,
      xUrl,
      recurrentEvent,
      status: status || 'Published'
    });
    
    await event.save();
    
    // Create General Lobby room for the event
    await ensureGeneralLobby(event._id);
    
    // Sync to Organizer's Google Calendar
    try {
      const user = await User.findById(req.user.id).select('+googleRefreshToken');
      if (user && user.googleRefreshToken && event.status === 'Published') {
        console.log(`[Google Calendar Sync] Syncing created event "${event.title}" for organizer ${user.email}`);
        await addEventToGoogleCalendar(user, event);
      }
    } catch (syncErr) {
      console.error('[Google Calendar Sync] Error syncing created event for organizer:', syncErr);
    }
    
    res.status(201).json(event);
  } catch (error) {
    console.error('[Publish Event] Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate field value entered', duplicate: error.keyValue });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Draft to Live
 * @route   POST /api/event/drafttolive/:id
 * @access  Private
 */
exports.draftToLive = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    // Check ownership
    if (event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to modify this event' });
    }

    event.status = 'Published';
    await event.save();

    // Create General Lobby room for the event
    await ensureGeneralLobby(event._id);

    // Sync to Organizer's Google Calendar
    try {
      const user = await User.findById(req.user.id).select('+googleRefreshToken');
      if (user && user.googleRefreshToken) {
        console.log(`[Google Calendar Sync] Syncing draft-to-live event "${event.title}" for organizer ${user.email}`);
        await addEventToGoogleCalendar(user, event);
      }
    } catch (syncErr) {
      console.error('[Google Calendar Sync] Error syncing draft-to-live event for organizer:', syncErr);
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/event/:id
 * @access  Private
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check ownership
    if (event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/event/:id
 * @access  Private
 */
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check ownership
    if (event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this event' });
    }

    // Update event
    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );


    res.json(event);
  } catch (error) {
    console.error('[Update Event] Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get event by ID
 * @route   GET /api/event/:id
 * @access  Public
 */
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const publicUrl = `${process.env.FRONTEND_URL || 'https://eventeev.com'}/${event.slug || event._id}`;
    const schedule = await Schedule.find({ event: event._id }).sort({ startTime: 1 });
    
    res.json({
      ...event._doc,
      publicUrl,
      schedule
    });
  } catch (error) {
    console.error('[Get Event By ID] Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
};
/**
 * @desc    Generate and download ICS file for an event
 * @route   GET /api/event/:id/ics
 * @access  Public
 */
exports.generateICS = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Ensure we have a valid start date
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate || event.startDate);
    
    // Format dates for ICS: YYYYMMDDTHHMMSSZ
    const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Eventeev//EN',
      'BEGIN:VEVENT',
      `UID:${event._id}@eventeev.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description ? event.description.replace(/\n/g, '\\n') : ''}`,
      `LOCATION:${event.location || 'Online'}`,
      `URL:${process.env.FRONTEND_URL || 'https://eventeev.com'}/${event.slug || event._id}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    res.set({
      'Content-Type': 'text/calendar',
      'Content-Disposition': `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '_')}.ics"`
    });

    res.send(icsContent);
  } catch (error) {
    console.error('[Generate ICS] Error:', error);
    res.status(500).send('Error generating calendar file');
  }
};
