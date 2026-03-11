const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const auth = require('../middleware/auth');

/**
 * @openapi
 * /api/link/event/{eventId}:
 *   get:
 *     tags: [Links]
 *     summary: Get all resource links for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/event/:eventId', linkController.getEventLinks);

/**
 * @openapi
 * /api/link:
 *   post:
 *     tags: [Links]
 *     summary: Create a new resource link
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event, title, url, type]
 *             properties:
 *               event: { type: string }
 *               title: { type: string }
 *               url: { type: string }
 *               type: { type: string, enum: [document, video, link] }
 *               description: { type: string }
 *               uploader: { type: string }
 *     responses:
 *       201:
 *         description: Link created
 */
router.post('/', auth, linkController.createLink);

/**
 * @openapi
 * /api/link/{id}:
 *   patch:
 *     tags: [Links]
 *     summary: Update a resource link
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               url: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *   delete:
 *     tags: [Links]
 *     summary: Delete a resource link
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.patch('/:id', auth, linkController.updateLink);
router.delete('/:id', auth, linkController.deleteLink);

module.exports = router;
