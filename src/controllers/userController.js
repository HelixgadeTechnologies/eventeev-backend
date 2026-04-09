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
  const { firstName, lastName, gender, tZone, country, avatar } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields if they exist in request body
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.gender = gender || user.gender;
    user.tZone = tZone || user.tZone;
    user.country = country || user.country;
    user.avatar = avatar || user.avatar;

    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('[Update User] Error:', error.message);
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
