const express = require('express');
const router = express.Router();
const { parser } = require('../config/cloudinary');
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');

/**
 * @openapi
 * /api/upload:
 *   post:
 *     tags: [Utility]
 *     summary: Upload an image to Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 public_id:
 *                   type: string
 */
router.post('/', auth, parser.single('image'), uploadController.uploadImage);

module.exports = router;
