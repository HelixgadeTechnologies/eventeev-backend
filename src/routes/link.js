const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const auth = require('../middleware/auth');

// @route   GET /api/link/event/:eventId
router.get('/event/:eventId', linkController.getEventLinks);

// @route   POST /api/link
router.post('/', auth, linkController.createLink);

// @route   PATCH /api/link/:id
router.patch('/:id', auth, linkController.updateLink);

// @route   DELETE /api/link/:id
router.delete('/:id', auth, linkController.deleteLink);

module.exports = router;
