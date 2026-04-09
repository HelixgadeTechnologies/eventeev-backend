const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

/**
 * @openapi
 * /api/user/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/me', auth, userController.getMe);

/**
 * @openapi
 * /api/user/all:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/all', userController.getAllUsers);

/**
 * @openapi
 * /api/user/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:id', userController.getUser);

/**
 * @openapi
 * /api/user/updateuser/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
router.put('/updateuser/:id', userController.updateUser);

module.exports = router;
