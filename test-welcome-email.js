/**
 * One-off test script to fire the welcome email template.
 * Run with: node test-welcome-email.js
 */
require('dotenv').config();

const sendEmail = require('./src/utils/sendEmail');
const getWelcomeEmailHtml = require('./src/utils/welcomeEmailTemplate');

const TEST_EMAIL = 'helixgade@gmail.com'; // sending test to the organiser
const TEST_NAME = 'Godfrey';

(async () => {
  console.log(`\n🚀 Sending test welcome email to ${TEST_EMAIL}...\n`);
  try {
    await sendEmail({
      email: TEST_EMAIL,
      subject: `Welcome to eventeev, ${TEST_NAME}! Let's get your event live 🚀`,
      message: `Hi ${TEST_NAME}, welcome to the eventeev family! Head to your dashboard to create your first event.`,
      html: getWelcomeEmailHtml(TEST_NAME)
    });
    console.log('✅ Test email sent successfully!');
  } catch (err) {
    console.error('❌ Failed to send test email:', err.message);
  }
  process.exit(0);
})();
