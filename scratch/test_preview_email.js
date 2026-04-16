require('dotenv').config();
const sendEmail = require('../src/utils/sendEmail');
const { generateRegistrationEmail } = require('../src/utils/registrationTemplate');

const sendTestEmail = async () => {
    console.log('Generating premium template...');
    
    const dummyData = {
        name: 'John Doe',
        event: {
            title: 'Eventeev Launch Keynote 2026',
            startDate: new Date('2026-06-20T10:00:00Z'),
            startTime: '10:00 AM',
            location: 'Eventeev Innovation Lab, Lagos & Online'
        },
        ticketType: 'VIP Pass',
        orderId: 'EV-8842-9901',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TEST-ATTENDEE-ID',
        amountPaid: '$150.00',
        attendeeId: '60d21b4667d0d8992e610c8a'
    };


    const htmlContent = generateRegistrationEmail(dummyData);

    console.log('Sending test email to alphadude4all@gmail.com...');
    
    try {
        await sendEmail({
            email: 'alphadude4all@gmail.com',
            subject: 'TEST: Event Registration Confirmation',
            html: htmlContent
        });

        console.log('SUCCESS: Preview email sent successfully.');
    } catch (error) {
        console.error('FAILED: Error sending preview email:', error);
    }
};

sendTestEmail();
