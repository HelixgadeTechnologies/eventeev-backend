require('dotenv').config();
const sendEmail = require('./src/utils/sendEmail');
const { generateRegistrationEmail } = require('./src/utils/registrationTemplate');

const testEmails = async () => {
  const targetEmail = process.env.EMAIL_USER; // Send to the sender's own email for testing
  
  console.log(`Starting email tests to ${targetEmail}...`);

  // Test 1: Sign up (OTP) Email
  try {
    console.log('Sending Test Sign Up Email...');
    await sendEmail({
      email: targetEmail,
      subject: 'Verify your Eventeev account (TEST)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
          <p>This is a test OTP verification email.</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
            123456
          </div>
        </div>
      `
    });
    console.log('✅ Sign Up Email sent successfully!');
  } catch (err) {
    console.error('❌ Failed to send Sign Up Email:', err.message);
  }

  // Test 2: Event Registration Email
  try {
    console.log('\nSending Test Event Registration Email...');
    const htmlTemplate = generateRegistrationEmail({
      name: 'John Test',
      event: {
        title: 'Eventeev Demo Party',
        startDate: new Date(),
        startTime: '18:00',
        endTime: '22:00',
        location: 'Virtual Test Location',
        bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'
      },
      ticketType: 'VIP Ticket',
      orderId: 'REG-123-TEST',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=test1234',
      amountPaid: 'Free',
      attendeeId: 'abc123xyz'
    });

    await sendEmail({
      email: targetEmail,
      subject: "You're In! Confirmation for Eventeev Demo Party (TEST)",
      html: htmlTemplate
    });
    console.log('✅ Event Registration Email sent successfully!');
  } catch (err) {
    console.error('❌ Failed to send Event Registration Email:', err.message);
  }
};

testEmails();
