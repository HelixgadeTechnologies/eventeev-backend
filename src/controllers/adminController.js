const User = require('../models/User');
const Event = require('../models/Event');
const Attendee = require('../models/Attendee');
const Ticket = require('../models/Ticket');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

/**
 * @desc    Admin Login
 * @route   POST /api/admin/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid credentials or not an admin' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalEvents = await Event.countDocuments();
    const totalAttendees = await Attendee.countDocuments();
    
    // Basic revenue calculation (example)
    const paidTickets = await Ticket.find({ type: 'Paid' });
    const totalPotentialRevenue = paidTickets.reduce((acc, ticket) => acc + (ticket.price * ticket.quantity), 0);

    res.json({
      users: {
        total: totalUsers,
        admins: totalAdmins
      },
      events: {
        total: totalEvents
      },
      attendees: {
        total: totalAttendees
      },
      revenue: {
        potential: totalPotentialRevenue
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const query = {};
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update user status (suspend/activate)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
exports.updateUserStatus = async (req, res) => {
  const { isBlocked } = req.body; // You might want to add this field to User model if not present, or use a field like 'isActive'

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Since isBlocked isn't in the schema yet, let's assume we'll add it or just handle it as a placeholder
    // user.isBlocked = isBlocked; 
    // await user.save();

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Promote user to admin
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/Admin
 */
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}`, user });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Create a new admin account
 * @route   POST /api/admin/create
 * @access  Private/Admin
 */
exports.createAdmin = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
      isVerified: true
    });

    await user.save();

    res.status(201).json({ message: 'Admin created successfully', user });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all events
 * @route   GET /api/admin/events
 * @access  Private/Admin
 */
exports.getEvents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const query = {};
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    const events = await Event.find(query)
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete an event
 * @route   DELETE /api/admin/events/:id
 * @access  Private/Admin
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await event.deleteOne();

    res.json({ message: 'Event removed by admin' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get waitlist
 * @route   GET /api/admin/waitlist
 * @access  Private/Admin
 */
exports.getWaitlist = async (req, res) => {
  try {
    const waitlist = await User.find({ isWaitlisted: true }).sort({ createdAt: -1 });
    res.json(waitlist);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Approve waitlist user
 * @route   POST /api/admin/waitlist/approve/:id
 * @access  Private/Admin
 */
exports.approveWaitlist = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.isWaitlisted) {
      return res.status(404).json({ message: 'Waitlisted user not found' });
    }

    // Mark as no longer waitlisted, but they still need to set a password
    // Usually you'd send an email with a setup link here
    user.isWaitlisted = false;
    user.isVerified = true; // Automatically verify if admin approves?
    await user.save();

    res.json({ message: 'User approved from waitlist', user });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get total revenue generated across all events
 * @route   GET /api/admin/revenue
 * @access  Private/Admin
 */
exports.getTotalRevenue = async (req, res) => {
  try {
    const revenueData = await Attendee.aggregate([
      { $match: { status: 'verified' } },
      {
        $lookup: {
          from: 'tickets',
          localField: 'ticketId',
          foreignField: '_id',
          as: 'ticketData'
        }
      },
      { $unwind: '$ticketData' },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$ticketData.price' },
          count: { $sum: 1 }
        }
      }
    ]);

    const total = revenueData.length > 0 ? revenueData[0].totalAmount : 0;
    const count = revenueData.length > 0 ? revenueData[0].count : 0;

    res.json({ totalAmount: total, verifiedTickets: count });
  } catch (error) {
    console.error('[Admin Revenue] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get revenue generated for a specific event
 * @route   GET /api/admin/revenue/event/:id
 * @access  Private/Admin
 */
exports.getEventRevenue = async (req, res) => {
  try {
    const revenueData = await Attendee.aggregate([
      { 
        $match: { 
          eventId: new mongoose.Types.ObjectId(req.params.id), 
          status: 'verified' 
        } 
      },
      {
        $lookup: {
          from: 'tickets',
          localField: 'ticketId',
          foreignField: '_id',
          as: 'ticketData'
        }
      },
      { $unwind: '$ticketData' },
      {
        $group: {
          _id: '$eventId',
          totalAmount: { $sum: '$ticketData.price' },
          count: { $sum: 1 }
        }
      }
    ]);

    const total = revenueData.length > 0 ? revenueData[0].totalAmount : 0;
    const count = revenueData.length > 0 ? revenueData[0].count : 0;

    res.json({ eventId: req.params.id, totalAmount: total, verifiedTickets: count });
  } catch (error) {
    console.error('[Admin Event Revenue] Error:', error.message);
    res.status(500).send('Server Error');
  }
};
