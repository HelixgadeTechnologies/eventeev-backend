const sendEmail = require('../utils/sendEmail');

/**
 * Handle contact form submission from the landing page
 * @route POST /api/support/contact
 * @access Public
 */
exports.handleContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, subject, message'
      });
    }

    const adminEmail = 'weareeventeev@gmail.com';
    const primaryColor = '#FF6B00';
    const darkBg = '#101828';

    // Email to Admin
    const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1D2939; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; border: 1px solid #EAECF0; border-radius: 12px; overflow: hidden; }
    .header { background-color: ${darkBg}; padding: 40px; text-align: center; color: white; }
    .content { padding: 40px; }
    .field { margin-bottom: 24px; }
    .label { font-size: 12px; font-weight: 600; color: #667085; text-transform: uppercase; margin-bottom: 4px; }
    .value { font-size: 16px; color: #101828; font-weight: 500; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #98A2B3; background: #F9FAFB; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 24px;">New Contact Inquiry</h1>
    </div>
    <div class="content">
      <div class="field">
        <p class="label">From</p>
        <p class="value">${name} (${email})</p>
      </div>
      <div class="field">
        <p class="label">Subject</p>
        <p class="value">${subject}</p>
      </div>
      <div class="field">
        <p class="label">Message</p>
        <p class="value" style="white-space: pre-wrap;">${message}</p>
      </div>
    </div>
    <div class="footer">
      Sent from Eventeev Landing Page Contact Form
    </div>
  </div>
</body>
</html>
    `;

    // Send email to admin
    await sendEmail({
      email: adminEmail,
      subject: `[Contact Form] ${subject}: from ${name}`,
      message: `You have a new contact inquiry from ${name} (${email}).\n\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: adminEmailHtml
    });

    // Optional: Send auto-reply to user
    const userEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1D2939; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; border: 1px solid #EAECF0; border-radius: 12px; overflow: hidden; }
    .header { background-color: ${primaryColor}; padding: 40px; text-align: center; color: white; }
    .content { padding: 40px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #98A2B3; background: #F9FAFB; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 24px;">We've Received Your Message</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Thank you for reaching out to Eventeev! We've received your message regarding "<strong>${subject}</strong>" and our team will get back to you as soon as possible.</p>
      <p>Best regards,<br>The Eventeev Team</p>
    </div>
    <div class="footer">
      &copy; 2026 Eventeev Technologies Inc.
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      email: email,
      subject: `We've received your message - Eventeev`,
      message: `Hi ${name}, thank you for reaching out to Eventeev! We've received your message and our team will get back to you as soon as possible.`,
      html: userEmailHtml
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};
