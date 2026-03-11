const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');

// @route   GET /api/checklist/event/:eventId
router.get('/event/:eventId', checklistController.getEventChecklist);

// @route   POST /api/checklist
router.post('/', checklistController.addChecklistItem);

// @route   PATCH /api/checklist/:id
router.patch('/:id', checklistController.editChecklistItem);

// @route   DELETE /api/checklist/:id
router.delete('/:id', checklistController.deleteChecklistItem);

// @route   POST /api/checklist/bulk
router.post('/bulk', checklistController.createChecklistBulk);

module.exports = router;
