const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  // 1. Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password } = req.body;

  try {
    // 2. Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 3. Create new user (password hashing is handled by User model middleware)
    user = new User({
      firstName,
      lastName,
      email,
      password
    });

    await user.save();

    // 4. Generate JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (err, token) => {
        if (err) throw err;
        
        // 5. Successful Response
        res.status(201).json({
          message: 'Registration successful',
          token,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
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
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  // 1. Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // 2. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 4. Generate JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (err, token) => {
        if (err) throw err;
        
        // 5. Successful Response
        res.json({
          message: 'Auth Successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
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
 * @desc    Forgot Password - Send Reset Link
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Simulate sending email
    res.json({ message: 'Reset link sent to your email' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Reset Password
 * @route   POST /api/auth/resetpassword/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  const { password } = req.body;
  try {
    // In a real app, find user by reset token and update password
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Verify Email
 * @route   GET /api/auth/verify/:token
 * @access  Public
 */
exports.verifyEmail = async (req, res) => {
  try {
    // In a real app, find user by verification token and mark as verified
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update Organisation
 * @route   PUT /api/auth/organisation
 * @access  Private
 */
exports.updateOrganisation = async (req, res) => {
  const { organizationName, organizationDescription } = req.body;
  try {
    // In a real app, find user by id from req.user and update
    res.json({ message: 'Organisation updated successful' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Join Waitlist
 * @route   POST /api/auth/waitlist
 * @access  Public
 */
exports.waitlist = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      if (user.isWaitlisted) {
        return res.status(400).json({ message: 'You are already on the waitlist!' });
      } else {
        return res.status(400).json({ message: 'This email is already registered as a full account.' });
      }
    }

    // Create a waitlisted user record
    user = new User({
      firstName,
      lastName,
      email,
      isWaitlisted: true
    });

    await user.save();

    res.status(201).json({
      message: 'Successfully joined the waitlist!',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
