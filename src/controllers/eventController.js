const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Speaker = require('../models/Speaker');
const { isEventExpired } = require('../utils/eventStatus');


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

    // Construct response with shareable URL (fallback to ID if slug is missing)
    const publicUrl = `${process.env.FRONTEND_URL || 'https://eventeev.vercel.app'}/events/${event.slug || event._id}`;

    res.json({
      ...event._doc,
      publicUrl,
      tickets,
      speakers
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
    const events = await Event.find({ status: 'Draft' });
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
    const events = await Event.find({ status: 'Completed' });
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
    res.status(201).json(event);
  } catch (error) {
    console.error('[Publish Event] Error:', error);
    res.status(500).send('Server Error');
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
    event.status = 'Published';
    await event.save();
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
    const publicUrl = `${process.env.FRONTEND_URL || 'https://eventeev.vercel.app'}/events/${event.slug || event._id}`;
    
    res.json({
      ...event._doc,
      publicUrl
    });
  } catch (error) {
    console.error('[Get Event By ID] Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
};
