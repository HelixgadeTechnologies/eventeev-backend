const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      // Force IPv4
      family: 4
    },
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const message = {
    from: `${process.env.FROM_NAME || 'Eventeev'} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log(`[Email] Success: Message sent to ${options.email}. ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email] Critical Failure: Could not send email to ${options.email}`);
    console.error(`[Email] Error details:`, error.message);
    throw error; // Rethrow to be caught by the caller (authController)
  }
};

module.exports = sendEmail;
