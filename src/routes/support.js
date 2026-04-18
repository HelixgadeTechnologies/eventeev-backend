const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

/**
 * @openapi
 * /api/support/contact:
 *   post:
 *     tags: [Support]
 *     summary: Submit contact form
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */
router.post('/contact', supportController.handleContactForm);

module.exports = router;
