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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Link'
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
 *             $ref: '#/components/schemas/Link'
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
 *             $ref: '#/components/schemas/Link'
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
