require('dotenv').config();
const mongoose = require('mongoose');
const Attendee = require('../src/models/Attendee');
const Event = require('../src/models/Event');
const Ticket = require('../src/models/Ticket');
const sendEmail = require('../src/utils/sendEmail');

const { generateRegistrationEmail } = require('../src/utils/registrationTemplate');

const resendEmail = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'alphadude4all@gmail.com';
        const attendee = await Attendee.findOne({ email }).sort({ createdAt: -1 });
        
        if (!attendee) {
            console.log('Attendee not found');
            return;
        }

        const event = await Event.findById(attendee.eventId);
        let ticketType = 'General Admission';
        if (attendee.ticketId) {
            const ticket = await Ticket.findById(attendee.ticketId);
            if (ticket) ticketType = ticket.name;
        }

        const amountPaid = 'Free'; // Mock for now

        console.log('Generating template for resend...');
        const htmlTemplate = generateRegistrationEmail({
            name: attendee.name,
            event: event,
            ticketType: ticketType,
            orderId: attendee.orderId,
            qrCodeUrl: attendee.qrCode,
            amountPaid: amountPaid,
            attendeeId: attendee._id
        });

        console.log('Sending re-send email...');
        await sendEmail({
            email: attendee.email,
            subject: `[RESEND] You’re In! Confirmation for ${event.title}`,
            html: htmlTemplate
        });
        console.log('SUCCESS: Resend successful');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

resendEmail();
