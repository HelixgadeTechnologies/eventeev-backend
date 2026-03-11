const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');

/**
 * @route   POST api/auth/register
 * @desc    Register user
 * @access  Public
 */
router.post(
  '/register',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  authController.register
);

/**
 * @route   POST api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

/**
 * @route   POST api/auth/forgotpassword
 * @desc    Forgot password
 * @access  Public
 */
router.post('/forgotpassword', authController.forgotPassword);

/**
 * @route   GET api/auth/verify/:token
 * @desc    Verify email
 * @access  Public
 */
router.get('/verify/:token', authController.verifyEmail);

/**
 * @route   POST api/auth/resetpassword/:token
 * @desc    Reset password
 * @access  Public
 */
router.post('/resetpassword/:token', authController.resetPassword);

const auth = require('../middleware/auth');

/**
 * @route   PUT api/auth/organisation
 * @desc    Update organisation
 * @access  Private
 */
router.put('/organisation', auth, authController.updateOrganisation);

module.exports = router;
