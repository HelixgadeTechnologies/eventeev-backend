const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const auth = require('../middleware/auth');

// @route   GET /api/checklist/event/:eventId
router.get('/event/:eventId', checklistController.getEventChecklist);

// @route   POST api/checklist
router.post('/', auth, checklistController.createChecklistItem);

// @route   POST api/checklist/bulk
router.post('/bulk', auth, checklistController.createBulkItems);

// @route   PATCH api/checklist/:id
router.patch('/:id', auth, checklistController.updateChecklistItem);

// @route   DELETE api/checklist/:id
router.delete('/:id', auth, checklistController.deleteChecklistItem);

module.exports = router;
