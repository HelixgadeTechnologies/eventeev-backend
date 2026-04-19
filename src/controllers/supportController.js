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

    // Check if email credentials are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASS) {
      if (!process.env.EMAIL_USER) console.error('[SUPPORT ERROR] EMAIL_USER not configured in environment.');
      if (!process.env.EMAIL_APP_PASS) console.error('[SUPPORT ERROR] EMAIL_APP_PASS not configured in environment.');
      
      return res.status(500).json({
        success: false,
        message: 'Email service is currently unavailable. Please try again later.'
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
    .logo-img { height: 28px; margin-bottom: 20px; }
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
      <img src="https://eventeev.vercel.app/logo-white.svg" alt="eventeev" class="logo-img" />
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

    // User Auto-reply Email
    const userEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1D2939; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; border: 1px solid #EAECF0; border-radius: 12px; overflow: hidden; }
    .header { background-color: ${primaryColor}; padding: 40px; text-align: center; color: white; }
    .content { padding: 40px; }
    .footer { padding: 40px 20px; text-align: center; font-size: 12px; color: #98A2B3; background: #F9FAFB; border-top: 1px solid #EAECF0; }
    .social-links { margin-bottom: 20px; }
    .social-icon { display: inline-block; margin: 0 10px; text-decoration: none; }
    .social-img { width: 24px; height: 24px; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://eventeev.vercel.app/logo-white.svg" alt="eventeev" height="32" style="margin-bottom: 20px;" />
      <h1 style="margin:0; font-size: 24px;">We've Received Your Message</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Thank you for reaching out to Eventeev! We've received your message regarding "<strong>${subject}</strong>" and our team will get back to you as soon as possible.</p>
      <p>Best regards,<br>The Eventeev Team</p>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="https://instagram.com/weareeventeev" class="social-icon">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" class="social-img" />
        </a>
        <a href="https://twitter.com/weareeventeev" class="social-icon">
          <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="X" class="social-img" />
        </a>
        <a href="https://facebook.com/weareeventeev" class="social-icon">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174848.png" alt="Facebook" class="social-img" />
        </a>
        <a href="https://linkedin.com/company/weareeventeev" class="social-icon">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" class="social-img" />
        </a>
      </div>
      <p style="margin-bottom: 10px;">Follow us <a href="https://instagram.com/weareeventeev" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">@weareeventeev</a></p>
      &copy; 2026 Eventeev Technologies Inc.
    </div>
  </div>
</body>
</html>
    `;

    // Send both emails using Promise.allSettled to prevent one failure from blocking the entire response
    // However, we still want to ensure the admin gets the email most importantly
    const results = await Promise.allSettled([
      sendEmail({
        email: adminEmail,
        subject: `[Contact Form] ${subject}: from ${name}`,
        message: `You have a new contact inquiry from ${name} (${email}).\n\nSubject: ${subject}\n\nMessage:\n${message}`,
        html: adminEmailHtml
      }),
      sendEmail({
        email: email,
        subject: `We've received your message - Eventeev`,
        message: `Hi ${name}, thank you for reaching out to Eventeev! We've received your message and our team will get back to you as soon as possible.`,
        html: userEmailHtml
      })
    ]);

    // Check results for logging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[SUPPORT ERROR] Failed to send ${index === 0 ? 'Admin' : 'User'} email:`, result.reason);
      }
    });

    // If both failed, we consider it a 500
    if (results[0].status === 'rejected' && results[1].status === 'rejected') {
      throw new Error('Both email transmissions failed');
    }

    res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Contact Form Final Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};
