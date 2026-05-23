const crypto = require('crypto');
const Event = require('../models/Event');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Add or invite a collaborator (manager/monitor) to an event
 * @route   POST /api/event/:id/collaborators
 * @access  Private (Owner or Admin)
 */
exports.addCollaborator = async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: 'Please provide email and role' });
  }

  if (!['manager', 'monitor'].includes(role)) {
    return res.status(400).json({ message: 'Role must be manager or monitor' });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Authorization check: Only event owner or platform admin can add collaborators
    if (event.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized to manage collaborators for this event' });
    }

    let user = await User.findOne({ email });

    if (user) {
      // 1. If user is the event owner
      if (event.owner.toString() === user._id.toString()) {
        return res.status(400).json({ message: 'The event owner cannot be added as a collaborator' });
      }

      // 2. If user is already a collaborator
      const isAlreadyCollaborator = event.collaborators.some(
        (c) => c.user.toString() === user._id.toString()
      );
      if (isAlreadyCollaborator) {
        return res.status(400).json({ message: 'User is already a collaborator on this event' });
      }

      // Add existing user to collaborators
      event.collaborators.push({ user: user._id, role });
      await event.save();

      // Send email notification to existing user
      try {
        await sendEmail({
          email: user.email,
          subject: `You have been added as a ${role} to "${event.title}"`,
          message: `Hello ${user.firstName},\n\nYou have been added as a ${role} to manage/monitor the event: "${event.title}". You can access it now on your dashboard.\n\nBest regards,\nEventeev Team`,
          html: `<p>Hello <strong>${user.firstName}</strong>,</p>
                 <p>You have been added as a <strong>${role}</strong> to manage/monitor the event: <strong>"${event.title}"</strong>.</p>
                 <p>You can access this event now on your dashboard.</p>
                 <p>Best regards,<br/>Eventeev Team</p>`
        });
      } catch (emailErr) {
        console.error('[Collaborator] Existing user email sending failed:', emailErr.message);
      }

      return res.status(200).json({
        message: 'Collaborator added successfully',
        collaborator: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar
          },
          role,
          addedAt: new Date()
        }
      });
    } else {
      // 3. User does not exist, trigger registration invitation onboarding flow
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const randomAvatarId = Math.floor(Math.random() * 4) + 1;
      const inviteToken = crypto.randomBytes(20).toString('hex');

      user = new User({
        firstName: 'Invited',
        lastName: 'Collaborator',
        email,
        password: tempPassword,
        avatar: `/avatars/avatar_${randomAvatarId}.png`,
        isVerified: false,
        verificationToken: crypto.createHash('sha256').update(inviteToken).digest('hex'),
        role: 'user'
      });

      await user.save();

      // Add the new invited user as collaborator
      event.collaborators.push({ user: user._id, role });
      await event.save();

      // Send invitation onboarding email with link
      const frontendUrl = process.env.FRONTEND_URL || 'https://eventeev.com';
      const inviteUrl = `${frontendUrl}/register?token=${inviteToken}&email=${encodeURIComponent(email)}`;

      try {
        await sendEmail({
          email,
          subject: `Invitation to collaborate on "${event.title}"`,
          message: `Hello,\n\nYou have been invited to collaborate on the event "${event.title}" as a ${role}.\n\nPlease register and setup your profile using this link: ${inviteUrl}\n\nBest regards,\nEventeev Team`,
          html: `<p>Hello,</p>
                 <p>You have been invited to manage/monitor the event <strong>"${event.title}"</strong> on Eventeev as a <strong>${role}</strong>.</p>
                 <p>Please register and complete your profile setup using the link below:</p>
                 <p><a href="${inviteUrl}" style="background-color: #eb5017; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accept Invitation & Register</a></p>
                 <p>Or copy and paste this link into your browser:<br/>${inviteUrl}</p>
                 <p>Best regards,<br/>Eventeev Team</p>`
        });
      } catch (emailErr) {
        console.error('[Collaborator] New user invite email sending failed:', emailErr.message);
      }

      return res.status(201).json({
        message: 'Collaborator invited successfully. Onboarding email sent.',
        collaborator: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar
          },
          role,
          addedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('[Add Collaborator] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all collaborators for an event
 * @route   GET /api/event/:id/collaborators
 * @access  Private (Owner, Manager, Monitor or Admin)
 */
exports.getCollaborators = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('collaborators.user', 'firstName lastName email avatar');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Access check: Owner, Platform Admin, or any collaborator can view
    const isOwner = event.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isCollaborator = event.collaborators.some(
      (c) => c.user && c.user._id.toString() === req.user.id
    );

    if (!isOwner && !isAdmin && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied: Not authorized to view collaborators' });
    }

    res.json(event.collaborators);
  } catch (error) {
    console.error('[Get Collaborators] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update collaborator role
 * @route   PATCH /api/event/:id/collaborators/:userId
 * @access  Private (Owner or Admin)
 */
exports.updateCollaborator = async (req, res) => {
  const { role } = req.body;

  if (!role || !['manager', 'monitor'].includes(role)) {
    return res.status(400).json({ message: 'Valid role is required (manager or monitor)' });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only owner or platform admin can update roles
    if (event.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized to update collaborator roles' });
    }

    const collaborator = event.collaborators.find(
      (c) => c.user.toString() === req.params.userId
    );

    if (!collaborator) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }

    collaborator.role = role;
    await event.save();

    res.json({ message: 'Collaborator role updated successfully', collaborators: event.collaborators });
  } catch (error) {
    console.error('[Update Collaborator] Error:', error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Remove collaborator
 * @route   DELETE /api/event/:id/collaborators/:userId
 * @access  Private (Owner or Admin)
 */
exports.removeCollaborator = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only owner or platform admin can remove collaborators
    if (event.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized to remove collaborators' });
    }

    const collaboratorIndex = event.collaborators.findIndex(
      (c) => c.user.toString() === req.params.userId
    );

    if (collaboratorIndex === -1) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }

    event.collaborators.splice(collaboratorIndex, 1);
    await event.save();

    res.json({ message: 'Collaborator removed successfully', collaborators: event.collaborators });
  } catch (error) {
    console.error('[Remove Collaborator] Error:', error.message);
    res.status(500).send('Server Error');
  }
};
