const crypto = require('crypto');
const { coreRegister } = require('./attendeeController');

/**
 * @desc    Handle Paystack Webhook
 * @route   POST /api/payment/paystack-webhook
 * @access  Public
 */
exports.handlePaystackWebhook = async (req, res) => {
  try {
    // 1. Verify Paystack Signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const event = req.body;

    // 2. Handle 'charge.success'
    if (event.event === 'charge.success') {
      const { reference, amount, metadata, customer } = event.data;
      
      // metadata should contain registration details
      const { eventId, ticketId, name, googleId } = metadata || {};
      const email = customer.email;

      if (eventId && name) {
        console.log(`[Webhook] Processing successful payment for ${email} (Event: ${eventId})`);
        
        try {
          const result = await coreRegister({
            eventId,
            name,
            email,
            ticketId,
            paymentReference: reference,
            amount: amount / 100, // Convert kobo/cents back to main unit
            googleId
          });

          if (result.alreadyRegistered) {
            console.log(`[Webhook] Attendee ${email} already registered for event ${eventId}.`);
          } else {
            console.log(`[Webhook] Attendee ${email} successfully registered via webhook.`);
          }
        } catch (regError) {
          console.error(`[Webhook] Registration failed for ${email}:`, regError.message);
          // We don't return 400 here because Paystack might retry unnecessarily
          // But we should log it.
        }
      } else {
        console.log(`[Webhook] Missing metadata for reference ${reference}. Skipping registration.`);
      }
    }

    // 3. Always return 200 to Paystack
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('[Paystack Webhook] Error:', error);
    res.status(500).send('Webhook Error');
  }
};
