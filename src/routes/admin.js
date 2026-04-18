const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @openapi
 * /api/admin/login:
 *   post:
 *     tags: [Admin]
 *     summary: Admin login
 */
router.post('/login', adminController.login);

// Protected Admin Routes
router.use(auth);
router.use(admin);

/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard stats
 */
router.get('/stats', adminController.getStats);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 */
router.get('/users', adminController.getUsers);

/**
 * @openapi
 * /api/admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user status
 */
router.patch('/users/:id/status', adminController.updateUserStatus);

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user role
 */
router.patch('/users/:id/role', adminController.updateUserRole);

/**
 * @openapi
 * /api/admin/create:
 *   post:
 *     tags: [Admin]
 *     summary: Create new admin
 */
router.post('/create', adminController.createAdmin);

/**
 * @openapi
 * /api/admin/events:
 *   get:
 *     tags: [Admin]
 *     summary: Get all events
 */
router.get('/events', adminController.getEvents);

/**
 * @openapi
 * /api/admin/events/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete event
 */
router.delete('/events/:id', adminController.deleteEvent);

/**
 * @openapi
 * /api/admin/waitlist:
 *   get:
 *     tags: [Admin]
 *     summary: Get waitlist
 */
router.get('/waitlist', adminController.getWaitlist);

/**
 * @openapi
 * /api/admin/waitlist/approve/{id}:
 *   post:
 *     tags: [Admin]
 *     summary: Approve waitlist user
 */
router.post('/waitlist/approve/:id', adminController.approveWaitlist);

/**
 * @openapi
 * /api/admin/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Get total platform revenue
 */
router.get('/revenue', adminController.getTotalRevenue);

/**
 * @openapi
 * /api/admin/revenue/event/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get revenue for a specific event
 */
router.get('/revenue/event/:id', adminController.getEventRevenue);

module.exports = router;
