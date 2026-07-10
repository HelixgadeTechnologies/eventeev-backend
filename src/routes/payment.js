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

/**
 * @openapi
 * /api/payment/initialize:
 *   post:
 *     tags: [Payment]
 *     summary: Initialize a Paystack transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, amount, eventId, ticketId, name]
 *             properties:
 *               email: { type: string }
 *               amount: { type: number }
 *               eventId: { type: string }
 *               ticketId: { type: string }
 *               name: { type: string }
 *               callback_url: { type: string }
 *     responses:
 *       200:
 *         description: Transaction initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authorization_url: { type: string }
 *                 access_code: { type: string }
 *                 reference: { type: string }
 *       400:
 *         description: Invalid request or ticket sold out
 */
router.post('/initialize', paymentController.initializePayment);

module.exports = router;
