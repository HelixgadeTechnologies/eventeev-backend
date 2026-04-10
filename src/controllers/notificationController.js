const Notification = require('../models/Notification');
const { getIO } = require('../utils/socket');

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/notification
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('[Notification Controller] getNotifications Error:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notification/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Make sure user owns notification
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('[Notification Controller] markAsRead Error:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notification/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[Notification Controller] markAllAsRead Error:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notification/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Make sure user owns notification
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await notification.remove();
    res.json({ message: 'Notification removed' });
  } catch (error) {
    console.error('[Notification Controller] deleteNotification Error:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Helper function to create and emit a notification
 * @param   {Object} data { recipient, sender, type, title, message, link }
 */
exports.createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();

    // Emit real-time notification via Socket.io
    const io = getIO();
    io.to(`user_${data.recipient}`).emit('new_notification', notification);
    
    return notification;
  } catch (error) {
    console.error('[Notification Helper] createNotification Error:', error);
  }
};
