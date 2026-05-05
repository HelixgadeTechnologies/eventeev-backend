const Link = require('../models/Link');
const Event = require('../models/Event');


/**
 * @desc    Get all links for a specific event
 * @route   GET /api/link/event/:eventId
 * @access  Public
 */
exports.getEventLinks = async (req, res) => {
  try {
    const links = await Link.find({ event: req.params.eventId }).sort({ date: -1 });
    res.json(links);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Create a new link/resource
 * @route   POST /api/link
 * @access  Private
 */
exports.createLink = async (req, res) => {
  const { event, title, url, type, description, addedBy } = req.body;
  try {
    // Check ownership
    const eventObj = await Event.findById(event);
    if (!eventObj || eventObj.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to create links for this event' });
    }

    const newLink = new Link({

      event,
      title,
      url,
      type,
      description,
      addedBy
    });
    await newLink.save();
    res.status(201).json(newLink);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Update a link
 * @route   PATCH /api/link/:id
 * @access  Private
 */
exports.updateLink = async (req, res) => {
  try {
    const { title, url, type, description, addedBy } = req.body;

    let link = await Link.findById(req.params.id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Check ownership
    const eventObj = await Event.findById(link.event);
    if (!eventObj || eventObj.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this link' });
    }


    if (title) link.title = title;
    if (url) link.url = url;
    if (type) link.type = type;
    if (description) link.description = description;
    if (addedBy) link.addedBy = addedBy;

    await link.save();
    res.json(link);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete a link
 * @route   DELETE /api/link/:id
 * @access  Private
 */
exports.deleteLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Check ownership
    const eventObj = await Event.findById(link.event);
    if (!eventObj || eventObj.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this link' });
    }

    await Link.findByIdAndDelete(req.params.id);

    res.json({ message: 'Link removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
