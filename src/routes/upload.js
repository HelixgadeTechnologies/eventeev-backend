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
// Wrapped Multer middleware to catch errors
router.post('/', auth, (req, res, next) => {
  parser.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Multer/Cloudinary Error]:', err);
      // Return specific error message to client
      return res.status(400).json({ 
        message: 'Image upload failed', 
        error: err.message || 'Unknown upload error' 
      });
    }
    next();
  }, uploadController.uploadImage);
});

module.exports = router;
