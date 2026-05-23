const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const eventController = require('../controllers/eventController');
const collaboratorController = require('../controllers/collaboratorController');
const auth = require('../middleware/auth');

/**
 * @openapi
 * /api/event/listing:
 *   get:
 *     tags: [Events]
 *     summary: Get upcoming published events for landing page
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter events by category
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *           enum: [week, month]
 *         description: Filter events by duration (current week or current month)
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/listing', eventController.getEventListing);
router.get('/public/:slug', eventController.getPublicEventBySlug);

/**
 * @openapi
 * /api/event/published:
 *   get:
 *     tags: [Events]
 *     summary: Get all published events
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/published', eventController.getPublishedEvents);

/**
 * @openapi
 * /api/event/drafts:
 *   get:
 *     tags: [Events]
 *     summary: Get all draft events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/drafts', auth, eventController.getDrafts);

/**
 * @openapi
 * /api/event/completed:
 *   get:
 *     tags: [Events]
 *     summary: Get all completed events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/completed', auth, eventController.getCompletedEvents);

/**
 * @openapi
 * /api/event/publish:
 *   post:
 *     tags: [Events]
 *     summary: Create/Publish a new event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *             description: The event details. Set status to 'Draft' to save without publishing immediately.
 *     responses:
 *       201:
 *         description: Event created/published successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 */
router.post(
  '/publish', 
  auth, 
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('type', 'Type must be virtual, hybrid, or in person').isIn(['virtual', 'hybrid', 'in person']),
    check('startDate', 'Please include a valid start date').isISO8601(),
    check('endDate', 'Please include a valid end date').isISO8601(),
    check('startTime', 'Start time is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty()
  ],
  eventController.publishEvent
);

/**
 * @openapi
 * /api/event/drafttolive/{id}:
 *   post:
 *     tags: [Events]
 *     summary: Make a draft event live
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event is now live
 */
router.post('/drafttolive/:id', auth, eventController.draftToLive);

/**
 * @openapi
 * /api/event/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventController.getEventById);
router.get('/:id/ics', eventController.generateICS);
router.put('/:id', auth, eventController.updateEvent);

/**
 * @openapi
 * /api/event/{id}:
 *   delete:
 *     tags: [Events]
 *     summary: Delete an event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.delete('/:id', auth, eventController.deleteEvent);

/**
 * @openapi
 * /api/event/{id}/collaborators:
 *   post:
 *     tags: [Events]
 *     summary: Add or invite a collaborator (manager/monitor) to an event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email: { type: string, format: email }
 *               role: { type: string, enum: [manager, monitor] }
 *     responses:
 *       200:
 *         description: Existing collaborator added successfully
 *       201:
 *         description: New collaborator invited successfully
 *   get:
 *     tags: [Events]
 *     summary: Get all collaborators for an event
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
router.post('/:id/collaborators', auth, collaboratorController.addCollaborator);
router.get('/:id/collaborators', auth, collaboratorController.getCollaborators);

/**
 * @openapi
 * /api/event/{id}/collaborators/{userId}:
 *   patch:
 *     tags: [Events]
 *     summary: Update collaborator role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [manager, monitor] }
 *     responses:
 *       200:
 *         description: Success
 *   delete:
 *     tags: [Events]
 *     summary: Remove collaborator
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.patch('/:id/collaborators/:userId', auth, collaboratorController.updateCollaborator);
router.delete('/:id/collaborators/:userId', auth, collaboratorController.removeCollaborator);

module.exports = router;
