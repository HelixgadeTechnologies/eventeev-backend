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

const Event = require('../models/Event');
const Attendee = require('../models/Attendee');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

/**
 * @desc    Initialize Paystack Transaction
 * @route   POST /api/payment/initialize
 * @access  Public
 */
exports.initializePayment = async (req, res) => {
  const { email, amount, eventId, ticketId, name, callback_url } = req.body;

  try {
    // 1. Validate Event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'Published') return res.status(400).json({ message: 'Registration is not open for this event' });

    // 2. Validate Ticket
    if (ticketId) {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      if (ticket.quantity <= 0) return res.status(400).json({ message: 'Ticket is sold out' });
    }

    // 3. Initialize Paystack Transaction
    // Paystack expects amount in kobo/cents
    const amountInKobo = Math.round(amount * 100);

    const payload = {
      email,
      amount: amountInKobo,
      metadata: {
        eventId,
        ticketId,
        name,
        // Passing cancel_action helps users go back to event page if they cancel
      }
    };

    if (callback_url) {
      payload.callback_url = callback_url;
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!result.status) {
      return res.status(400).json({ message: result.message || 'Failed to initialize payment' });
    }

    // 4. Create or Update Pending Attendee
    const existingRegistration = await Attendee.findOne({ eventId, email });
    if (existingRegistration) {
      if (existingRegistration.status === 'pending') {
        existingRegistration.paymentReference = result.data.reference;
        existingRegistration.amount = amount;
        await existingRegistration.save();
      } else {
        return res.status(400).json({ message: 'You have already registered for this event' });
      }
    } else {
      const attendeeId = new mongoose.Types.ObjectId();
      const orderId = `REG-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${attendeeId}`;
      
      const pendingAttendee = new Attendee({
        _id: attendeeId,
        eventId,
        ticketId,
        name,
        email,
        orderId,
        qrCode: qrCodeUrl,
        paymentReference: result.data.reference,
        amount: amount,
        status: 'pending' 
      });
      await pendingAttendee.save();
    }

    // result.data contains authorization_url, access_code, reference
    res.json(result.data);
  } catch (error) {
    console.error('[Initialize Payment] Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
