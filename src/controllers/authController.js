const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

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

  const { firstName, lastName, email, password, orgName, orgWebsite, orgIndustry } = req.body;

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
      password,
      orgName,
      orgWebsite,
      orgIndustry
    });

    await user.save();

    // 4. Generate JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email
      }
    };

    if (!process.env.JWT_SECRET) {
      console.error('[Registration] CRITICAL: JWT_SECRET environment variable is missing.');
      return res.status(500).send('Server Error: Authentication configuration missing');
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      async (err, token) => {
        if (err) {
          console.error('[Registration] JWT signing error:', err);
          return res.status(500).send('Server Error');
        }

        try {
          await sendEmail({
            email: user.email,
            subject: `Welcome to eventeev, ${user.firstName}! Let’s get your event live 🚀`,
            message: `Hi ${user.firstName},\nWelcome to the eventeev family! We’re thrilled to have you on board. You’ve just taken the first step toward creating a seamless, high-impact event experience.\n\nOur goal is to make your planning process as stress-free as possible. Here is a quick breakdown of what you can do right now to get started:\n\nCreate Your First Event: Head to your dashboard to set up your event page, ticket types, and games for your attendees.\n\nCustomize Your Registration: Tailor your attendee forms to get the exact data you need.\n\nExplore the Toolkit: Check out our real-time analytics and check-in tools.\n\nPro Tip: Events with a detailed description and a high-quality banner image see a 30% higher registration rate!\n\nNeed a hand? Our support team is just a reply away, or you can browse our Help Center for quick tutorials.\n\nCheers,\nThe eventeev Team`,
            html: `<p>Hi ${user.firstName},</p>
<p>Welcome to the eventeev family! We’re thrilled to have you on board. You’ve just taken the first step toward creating a seamless, high-impact event experience.</p>
<p>Our goal is to make your planning process as stress-free as possible. Here is a quick breakdown of what you can do right now to get started:</p>
<ul>
  <li><strong>Create Your First Event:</strong> Head to your dashboard to set up your event page, ticket types, and games for your attendees.</li>
  <li><strong>Customize Your Registration:</strong> Tailor your attendee forms to get the exact data you need.</li>
  <li><strong>Explore the Toolkit:</strong> Check out our real-time analytics and check-in tools.</li>
</ul>
<p><strong>Pro Tip:</strong> Events with a detailed description and a high-quality banner image see a 30% higher registration rate!</p>
<p>Need a hand? Our support team is just a reply away, or you can browse our Help Center for quick tutorials.</p>
<p>Cheers,<br>The eventeev Team</p>`
          });
        } catch (emailErr) {
          console.error('[Registration] Welcome email sending error:', emailErr);
        }
        
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
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Verify password
    if (!user.password) {
      console.warn(`[Login] Login attempt for user ${email} failed: No password set (possibly waitlisted user).`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

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

    if (!process.env.JWT_SECRET) {
      console.error('[Login] CRITICAL: JWT_SECRET environment variable is missing.');
      return res.status(500).send('Server Error: Authentication configuration missing');
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      (err, token) => {
        if (err) {
          console.error('[Login] JWT signing error:', err);
          return res.status(500).send('Server Error');
        }
        
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
    console.error('[Login] Unexpected Server Error:', error);
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

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
        html: `<p>You requested a password reset. Please use the following link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Reset Password
 * @route   PUT /api/auth/resetpassword/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
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
    // Hash token
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update Organisation
 * @route   PUT /api/auth/organisation
 * @access  Private
 */
exports.updateOrganisation = async (req, res) => {
  const { orgName, orgWebsite, orgIndustry } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.orgName = orgName || user.orgName;
    user.orgWebsite = orgWebsite || user.orgWebsite;
    user.orgIndustry = orgIndustry || user.orgIndustry;

    await user.save();

    res.json({ 
      message: 'Organisation updated successful',
      user: {
        id: user.id,
        orgName: user.orgName,
        orgWebsite: user.orgWebsite,
        orgIndustry: user.orgIndustry
      }
    });
  } catch (error) {
    console.error(error.message);
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
