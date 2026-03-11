const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');

/**
 * @openapi
 * /api/event/published:
 *   get:
 *     tags: [Events]
 *     summary: Get all published events
 *     responses:
 *       200:
 *         description: Success
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
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Event created
 */
router.post('/publish', auth, eventController.publishEvent);

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

module.exports = router;
