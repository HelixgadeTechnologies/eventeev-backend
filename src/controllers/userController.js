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
    // Check ownership: Users can only update their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'User not authorized to update this profile' });
    }

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

const crypto = require('crypto');

/**
 * @desc    Get all teammates under the logged in user's workspace
 * @route   GET /api/user/teammates
 * @access  Private
 */
exports.getTeammates = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('teammates.user', 'firstName lastName email avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Always structure the workspace teammates starting with the Owner
    const ownerRecord = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar
      },
      role: 'Owner',
      status: 'Active',
      addedAt: user.createdAt
    };

    const teamList = [ownerRecord, ...user.teammates];
    res.json(teamList);
  } catch (error) {
    console.error('[Get Teammates] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Invite a teammate to join the workspace team
 * @route   POST /api/user/teammates
 * @access  Private
 */
exports.inviteTeammate = async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: 'Please provide email and role' });
  }

  if (!['Organizer', 'Coordinator', 'Staff'].includes(role)) {
    return res.status(400).json({ message: 'Role must be Organizer, Coordinator, or Staff' });
  }

  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Prevent inviting yourself
    if (currentUser.email === email.toLowerCase().trim()) {
      return res.status(400).json({ message: 'You cannot invite yourself to your own team' });
    }

    // 2. Check if user already exists
    let targetUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (targetUser) {
      // Check if already a teammate
      const isAlreadyTeammate = currentUser.teammates.some(
        (t) => t.user.toString() === targetUser._id.toString()
      );
      if (isAlreadyTeammate) {
        return res.status(400).json({ message: 'User is already a teammate in your workspace' });
      }

      // Add to teammates
      currentUser.teammates.push({ user: targetUser._id, role, status: 'Active' });
      await currentUser.save();

      return res.status(200).json({
        message: 'Teammate added successfully',
        teammate: {
          user: {
            id: targetUser._id,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            email: targetUser.email,
            avatar: targetUser.avatar
          },
          role,
          status: 'Active',
          addedAt: new Date()
        }
      });
    } else {
      // 3. Create a provisional/unverified teammate account
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const randomAvatarId = Math.floor(Math.random() * 4) + 1;

      targetUser = new User({
        firstName: 'Invited',
        lastName: 'Teammate',
        email: email.toLowerCase().trim(),
        password: tempPassword,
        avatar: `/avatars/avatar_${randomAvatarId}.png`,
        isVerified: false,
        role: 'user'
      });

      await targetUser.save();

      // Add to teammates as Pending
      currentUser.teammates.push({ user: targetUser._id, role, status: 'Pending' });
      await currentUser.save();

      return res.status(201).json({
        message: 'Teammate invited successfully. Provisional account created.',
        teammate: {
          user: {
            id: targetUser._id,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            email: targetUser.email,
            avatar: targetUser.avatar
          },
          role,
          status: 'Pending',
          addedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('[Invite Teammate] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Remove a teammate from the workspace team
 * @route   DELETE /api/user/teammates/:userId
 * @access  Private
 */
exports.removeTeammate = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const teammateIndex = currentUser.teammates.findIndex(
      (t) => t.user.toString() === req.params.userId
    );

    if (teammateIndex === -1) {
      return res.status(404).json({ message: 'Teammate not found in this workspace' });
    }

    currentUser.teammates.splice(teammateIndex, 1);
    await currentUser.save();

    res.json({ message: 'Teammate removed successfully' });
  } catch (error) {
    console.error('[Remove Teammate] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

