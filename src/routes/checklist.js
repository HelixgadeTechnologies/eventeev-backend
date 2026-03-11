const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const auth = require('../middleware/auth');

/**
 * @openapi
 * /api/checklist/event/{eventId}:
 *   get:
 *     tags: [Checklist]
 *     summary: Get checklist for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/event/:eventId', checklistController.getEventChecklist);

/**
 * @openapi
 * /api/checklist:
 *   post:
 *     tags: [Checklist]
 *     summary: Create a new checklist item
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event, title, category]
 *             properties:
 *               event: { type: string }
 *               title: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Checklist item created
 */
router.post('/', auth, checklistController.createChecklistItem);

/**
 * @openapi
 * /api/checklist/bulk:
 *   post:
 *     tags: [Checklist]
 *     summary: Create multiple checklist items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event, items]
 *             properties:
 *               event: { type: string }
 *               items: 
 *                 type: array
 *                 items: { type: object }
 *     responses:
 *       201:
 *         description: Items created
 */
router.post('/bulk', auth, checklistController.createBulkItems);

/**
 * @openapi
 * /api/checklist/{id}:
 *   patch:
 *     tags: [Checklist]
 *     summary: Update a checklist item
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
 *               status: { type: string, enum: [Done, Incomplete] }
 *     responses:
 *       200:
 *         description: Success
 *   delete:
 *     tags: [Checklist]
 *     summary: Delete a checklist item
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
router.patch('/:id', auth, checklistController.updateChecklistItem);
router.delete('/:id', auth, checklistController.deleteChecklistItem);

module.exports = router;
