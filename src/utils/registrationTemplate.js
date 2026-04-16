/**
 * Generates a premium HTML registration confirmation email
 * @param {Object} data - Event and Attendee details
 * @returns {string} HTML string
 */
const generateRegistrationEmail = ({ name, event, ticketType, orderId, qrCodeUrl, amountPaid, attendeeId }) => {
  const eventDate = new Date(event.startDate).toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const primaryColor = '#FF6B00';
  const darkBg = '#101828';
  const lightBg = '#F9FAFB';
  const backendUrl = process.env.BACKEND_URL || 'https://eventeevapi.onrender.com';


  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Registration is Confirmed!</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #F4F4F7; color: #1D2939; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background-color: ${darkBg}; padding: 60px 40px; text-align: center; position: relative; }
    .header-pattern { position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.15; pointer-events: none; }
    .logo-img { height: 32px; margin-bottom: 30px; }
    .hero-title { color: #ffffff; font-size: 32px; font-weight: 800; margin: 0; line-height: 1.2; }
    .hero-subtitle { color: #98A2B3; font-size: 16px; margin-top: 10px; }
    
    .content { padding: 40px; }
    .greeting { font-size: 20px; font-weight: 600; margin-bottom: 16px; }
    .main-text { line-height: 1.6; color: #475467; margin-bottom: 32px; }
    
    .details-card { background-color: ${lightBg}; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #EAECF0; }
    .details-row { display: flex; margin-bottom: 12px; }
    .details-label { font-size: 12px; font-weight: 600; color: #667085; text-transform: uppercase; margin-bottom: 4px; }
    .details-value { font-size: 15px; font-weight: 500; color: #101828; }
    
    .qr-section { text-align: center; padding: 32px; background-color: #ffffff; border: 2px dashed #EAECF0; border-radius: 12px; margin-bottom: 40px; }
    .qr-image { width: 200px; height: 200px; margin: 0 auto 16px; }
    .qr-text { font-size: 14px; font-weight: 500; color: #475467; }
    
    .footer { padding: 40px; text-align: center; background-color: #ffffff; border-top: 1px solid #EAECF0; }
    .social-links { margin-bottom: 24px; }
    .social-icon { display: inline-block; margin: 0 12px; text-decoration: none; }
    .social-img { width: 24px; height: 24px; opacity: 0.6; transition: opacity 0.2s; }
    .footer-text { font-size: 12px; color: #98A2B3; line-height: 1.5; }
    .footer-link { color: ${primaryColor}; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://eventeev.vercel.app/logo-white.svg" alt="eventeev" class="logo-img" />
      <h1 class="hero-title">${event.title} Registration Confirmed</h1>
      <p class="hero-subtitle">${eventDate} • ${event.location || 'Online Event'}</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hi ${name},</p>
      <p class="main-text">Great news! You're officially registered for <strong>${event.title}</strong>. We've saved a spot just for you, and we're excited to have you join us for an incredible experience.</p>
      
      <div class="details-card">
        <div style="margin-bottom: 20px;">
          <p class="details-label">Date</p>
          <p class="details-value">${eventDate}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <p class="details-label">Time</p>
          <p class="details-value">${event.startTime || 'TBD'}</p>
        </div>
        <div>
          <p class="details-label">Location</p>
          <p class="details-value">${event.location || 'Online'}</p>
        </div>
      </div>
      
      <div class="qr-section">
        <img src="${qrCodeUrl}" alt="Check-in QR Code" class="qr-image" />
        <p class="qr-text">Scan this QR code at the door for quick entry</p>
      </div>
      
      <p style="text-align: center; margin-top: 20px;">
        <a href="${backendUrl}/api/attendee/ticket/${attendeeId}/download" style="background-color: ${primaryColor}; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(255,107,0,0.2);">Download Ticket as PDF</a>
      </p>
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

      <p class="footer-text">
        Follow us <a href="#" class="footer-link">@weareeventeev</a> for the latest event updates.<br>
        This email was sent to you because you registered for an event on <a href="#" class="footer-link">Eventeev</a>.<br>
        &copy; 2026 Eventeev Technologies Inc.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { generateRegistrationEmail };
