const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

// Sign up endpoint
exports.signup = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });

    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, 
      },
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP Transport Error:", error);
      } else {
        console.log("SMTP Server Ready:", success);
      }
    });

    // Email content
    const mailOptions = {
      from: `"Eventeev" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify Your Account",
      html: `
        <h2>Hello ${firstname},</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="http://localhost:5000/auth/verify/${token}">Verify Email</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
        token
    });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({
      message: "Error during registration",
      error: error.message,
    });
  }
};

// Verify user endpoint
exports.verifyuser = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    res.json({ message: "Account verified successfully!", user });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};

// organisation details
exports.organisationdetails = async (req, res) => {
  try {
    const { organisationName, organisationWebsite, organisationIndustry } =
      req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: "User must be verified first" });
    }

    user.organisationName = organisationName;
    user.organisationWebsite = organisationWebsite;
    user.organisationIndustry = organisationIndustry;

    await user.save();

    res
      .status(200)
      .json({ message: "Organisation details added successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error updating organisation details",
        error: error.message,
      });
  }
};

// Login endpoint
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const secret = process.env.JWT_KEY;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Auth Failed" });
    }

    // Generate token
    const token = jwt.sign({ email: user.email, userId: user._id }, secret, {
      expiresIn: "7d",
    });

    res.status(200).json({ message: "Auth Successful", user, token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

// forgot password
exports.forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
      expiresIn: "1hr",
    });

    // Create a password reset link
    const resetLink = `http://localhost:5000/auth/reset-password/${resetToken}`;

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Eventeev" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: `
        <h2>Hello,</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link is valid for 15 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Password reset link sent to your email.", resetToken });
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    res.status(500).json({
      message: "Error sending password reset email",
      error: error.message,
    });
  }
};

// reset password 
exports.resetpassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .json({
        message:
          "Password reset successful. You can now log in with your new password.",
      });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(400).json({
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

