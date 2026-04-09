const User = require('../models/User');

/**
 * @desc    Get current logged in user
 * @route   GET /api/user/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/user/updateuser/:id
 * @access  Private
 */
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get user by id
 * @route   GET /api/user/:id
 * @access  Public
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/user/all
 * @access  Private
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
