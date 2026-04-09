const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *         isWaitlisted:
 *           type: boolean
 *         orgName:
 *           type: string
 *         orgWebsite:
 *           type: string
 *         orgIndustry:
 *           type: string
 *         avatar:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 60d21b4667d0d8992e610c85
 *         firstName: John
 *         lastName: Doe
 *         email: john.doe@example.com
 *         password: password123
 *         isWaitlisted: false
 *         orgName: Eventeev
 *         orgWebsite: https://eventeev.com
 *         orgIndustry: Technology
 */
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: function() {
      // Password is only required if NOT waitlisted
      return !this.isWaitlisted;
    },
    minlength: 6,
    select: false,
  },
  isWaitlisted: {
    type: Boolean,
    default: false,
  },
  orgName: {
    type: String,
  },
  orgWebsite: {
    type: String,
  },
  orgIndustry: {
    type: String,
  },
  avatar: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
