const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const getWelcomeEmailHtml = require('../utils/welcomeEmailTemplate');

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
    const randomAvatarId = Math.floor(Math.random() * 4) + 1;
    user = new User({
      firstName,
      lastName,
      email,
      password,
      orgName,
      orgWebsite,
      orgIndustry,
      avatar: `/avatars/avatar_${randomAvatarId}.png`,
      role: 'user' // Explicitly set to user
    });

    await user.save();

    // 4. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 20 * 60 * 1000; // 20 minutes

    user.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpire = otpExpire;
    await user.save();

    // 5. Send OTP Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your Eventeev account',
        message: `Your verification code is ${otp}. It expires in 20 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #1B1818; text-align: center;">Verify Your Account</h2>
            <p style="font-size: 16px; color: #333;">Hi ${user.firstName},</p>
            <p style="font-size: 16px; color: #333;">Thank you for signing up for Eventeev! Please use the following 6-digit code to verify your account:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; color: #eb5017;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666;">This code will expire in 20 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2024 Eventeev. All rights reserved.</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('[Registration] OTP email sending error:', emailErr);
      // Delete the created user so they can try again
      await User.findByIdAndDelete(user.id);
      return res.status(500).json({ 
        message: 'Registration failed: Could not send verification email. Please check your email address or try again later.' 
      });
    }

    // 6. Successful Response (No JWT yet, as they need to verify OTP)
    res.status(201).json({
      message: 'Registration successful. Please verify your email with the OTP sent.',
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

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Verify OTP
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    
    if (user.otpCode !== hashedOtp || user.otpExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields and set verified
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save();

    // Generate JWT now that they are verified
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
          message: 'OTP verified successfully',
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
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 20 * 60 * 1000; // 20 minutes

    user.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpire = otpExpire;
    await user.save();

    // Send Email
    await sendEmail({
      email: user.email,
      subject: 'Your new verification code',
      message: `Your new verification code is ${otp}. It expires in 20 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #1B1818; text-align: center;">New Verification Code</h2>
          <p style="font-size: 16px; color: #333;">Hi ${user.firstName},</p>
          <p style="font-size: 16px; color: #333;">As requested, here is your new 6-digit code to verify your account:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; color: #eb5017;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 20 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2024 Eventeev. All rights reserved.</p>
        </div>
      `
    });

    res.json({ message: 'New OTP sent successfully' });
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

    // Ensure user has a professional avatar
    if (!user.avatar) {
      const randomAvatarId = Math.floor(Math.random() * 4) + 1;
      user.avatar = `/avatars/avatar_${randomAvatarId}.png`;
      await user.save();
    }

    // 4. Generate JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
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
            lastName: user.lastName,
            role: user.role
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
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendUrl}/password-reset/${resetToken}`;

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
