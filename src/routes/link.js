const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');

// @route   GET /api/link/event/:eventId
router.get('/event/:eventId', linkController.getEventLinks);

// @route   POST /api/link
router.post('/', linkController.createLink);

// @route   PATCH /api/link/:id
router.patch('/:id', linkController.updateLink);

// @route   DELETE /api/link/:id
router.delete('/:id', linkController.deleteLink);

module.exports = router;
