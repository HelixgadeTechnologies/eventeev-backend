const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

/**
 * @openapi
 * /api/payment/paystack-webhook:
 *   post:
 *     tags: [Payment]
 *     summary: Paystack Webhook handler
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/paystack-webhook', paymentController.handlePaystackWebhook);

module.exports = router;
