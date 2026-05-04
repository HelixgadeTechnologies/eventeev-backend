require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
  console.log('--- Email Debug Test ---');
  console.log('User:', process.env.EMAIL_USER);
  console.log('Pass:', process.env.EMAIL_APP_PASS ? '********' : 'MISSING');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4,
  });

  const message = {
    from: `Debug <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Send to self
    subject: 'Email Debug Test',
    text: 'If you see this, email sending is working!',
  };

  try {
    console.log('Attempting to send mail...');
    const info = await transporter.sendMail(message);
    console.log('✅ Success! ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed!');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Full Error:', error);
  }
};

testEmail();
