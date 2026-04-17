const Checklist = require('../models/Checklist');
const Event = require('../models/Event');
const CHECKLIST_TEMPLATES = require('../utils/checklistTemplates');

/**
 * @desc    Get checklist for a specific event
 * @route   GET /api/checklist/event/:eventId
 * @access  Public
 */
exports.getEventChecklist = async (req, res) => {
  try {
    const checklist = await Checklist.find({ event: req.params.eventId }).sort({ createdAt: 1 });
    res.json(checklist);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Add a single checklist item
 * @route   POST /api/checklist
 * @access  Private
 */
exports.createChecklistItem = async (req, res) => {
  const { event: eventId, title, description, category, status, priority, date, time } = req.body;
  try {
    // Verify event ownership
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to manage this event' });
    }

    const checklistItem = new Checklist({
      event: eventId,
      title,
      description,
      category,
      status,
      priority,
      date,
      time
    });
    await checklistItem.save();
    res.status(201).json(checklistItem);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Edit a checklist item
 * @route   PATCH /api/checklist/:id
 * @access  Private
 */
exports.updateChecklistItem = async (req, res) => {
  const { title, description, category, status, priority, date, time } = req.body;
  try {
    let checklistItem = await Checklist.findById(req.params.id).populate('event');
    if (!checklistItem) {
      return res.status(404).json({ message: 'Checklist item not found' });
    }

    // Verify ownership
    if (checklistItem.event.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to manage this event' });
    }

    if (title !== undefined) checklistItem.title = title;
    if (description !== undefined) checklistItem.description = description;
    if (category !== undefined) checklistItem.category = category;
    if (status !== undefined) checklistItem.status = status;
    if (priority !== undefined) checklistItem.priority = priority;
    if (date !== undefined) checklistItem.date = date;
    if (time !== undefined) checklistItem.time = time;

    await checklistItem.save();
    res.json(checklistItem);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete a checklist item
 * @route   DELETE /api/checklist/:id
 * @access  Private
 */
exports.deleteChecklistItem = async (req, res) => {
  try {
    const checklistItem = await Checklist.findById(req.params.id).populate('event');
    if (!checklistItem) {
      return res.status(404).json({ message: 'Checklist item not found' });
    }

    // Verify ownership
    if (checklistItem.event.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to manage this event' });
    }

    await Checklist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Checklist item removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Bulk create checklist items (Create a checklist)
 * @route   POST /api/checklist/bulk
 * @access  Private
 */
exports.createBulkItems = async (req, res) => {
  const { eventId, items } = req.body;
  try {
    // Verify event ownership
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to manage this event' });
    }

    const checklistItems = items.map(item => ({
      ...item,
      event: eventId
    }));
    const createdItems = await Checklist.insertMany(checklistItems);
    res.status(201).json(createdItems);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Initialize checklist from a template
 * @route   POST /api/checklist/initialize
 * @access  Private
 */
exports.initializeChecklist = async (req, res) => {
  const { eventId, templateType } = req.body;
  try {
    // Verify event ownership
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to manage this event' });
    }

    // Get template items
    const templateItems = CHECKLIST_TEMPLATES[templateType] || CHECKLIST_TEMPLATES.default;
    
    // Prepare items with eventId
    const itemsToCreate = templateItems.map(item => ({
      ...item,
      event: eventId,
      status: 'Incomplete'
    }));

    // Optional: Clear existing items first? 
    // The user said "you can delete the checklist item not the checklist", 
    // but initializing usually means starting fresh. 
    // I'll just append them for now as per "allow user add a checklist" (template).
    
    const createdItems = await Checklist.insertMany(itemsToCreate);
    res.status(201).json(createdItems);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
