const nodemailer = require('nodemailer');
const dns = require('dns');
const net = require('net');

// Enforce IPv4 result order globally in Node.js
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Nodemailer uses c-ares internal DNS resolution which can pick IPv6 and fail on hosts without IPv6 routing.
// We patch Nodemailer's shared networkInterfaces and resolveHostname to guarantee only IPv4 addresses are selected.
try {
  const shared = require('nodemailer/lib/shared');
  if (shared && shared.networkInterfaces) {
    for (const name of Object.keys(shared.networkInterfaces)) {
      shared.networkInterfaces[name] = shared.networkInterfaces[name].filter(
        iface => iface.family === 'IPv4' || iface.family === 4
      );
    }
  }

  if (shared && typeof shared.resolveHostname === 'function') {
    const origResolveHostname = shared.resolveHostname;
    shared.resolveHostname = function (options, callback) {
      return origResolveHostname(options, (err, resolved) => {
        if (err) return callback(err);
        if (resolved && resolved._addresses) {
          const ipv4Only = resolved._addresses.filter(addr => net.isIPv4(addr));
          if (ipv4Only.length > 0) {
            resolved._addresses = ipv4Only;
            if (!net.isIPv4(resolved.host)) {
              resolved.host = ipv4Only[Math.floor(Math.random() * ipv4Only.length)];
            }
          }
        }
        callback(null, resolved);
      });
    };
  }
} catch (patchErr) {
  console.warn('[sendEmail] IPv4 patch warning:', patchErr.message);
}

/**
 * Send an email via HTTPS REST API (Brevo, Resend, SendGrid) or fallback to Nodemailer SMTP.
 * REST APIs bypass Render Free Tier's outbound SMTP port blocking (ports 25, 465, 587).
 */
const sendEmail = async (options) => {
  const recipientEmail = options.email;
  const subject = options.subject;
  const textContent = options.message || options.text || '';
  const htmlContent = options.html || `<p>${textContent}</p>`;
  const fromName = process.env.FROM_NAME || 'Eventeev';

  // 1. Check for Brevo (Sendinblue) HTTP API (Free: 300 emails/day, no custom domain required)
  if (process.env.BREVO_API_KEY) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'support@eventeev.com';
    console.log(`[Email] Dispatching via Brevo HTTPS API to ${recipientEmail}...`);
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: senderEmail },
        to: [{ email: recipientEmail, name: options.name || recipientEmail.split('@')[0] }],
        subject,
        htmlContent,
        textContent,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data.message || JSON.stringify(data);
      console.error(`[Email] Brevo API Error (${res.status}):`, errMsg);
      throw new Error(`Brevo API Error: ${errMsg}`);
    }
    console.log(`[Email] Success: Sent via Brevo to ${recipientEmail}. ID: ${data.messageId || 'ok'}`);
    return data;
  }

  // 2. Check for Resend HTTP API (Free: 100 emails/day, 3000/month)
  if (process.env.RESEND_API_KEY) {
    const resendFrom = process.env.RESEND_FROM_EMAIL || (process.env.EMAIL_USER ? `${fromName} <${process.env.EMAIL_USER}>` : `${fromName} <onboarding@resend.dev>`);
    console.log(`[Email] Dispatching via Resend HTTPS API to ${recipientEmail}...`);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [recipientEmail],
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data.message || JSON.stringify(data);
      console.error(`[Email] Resend API Error (${res.status}):`, errMsg);
      throw new Error(`Resend API Error: ${errMsg}`);
    }
    console.log(`[Email] Success: Sent via Resend to ${recipientEmail}. ID: ${data.id || 'ok'}`);
    return data;
  }

  // 3. Check for SendGrid HTTP API
  if (process.env.SENDGRID_API_KEY) {
    const senderEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || 'support@eventeev.com';
    console.log(`[Email] Dispatching via SendGrid HTTPS API to ${recipientEmail}...`);
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: recipientEmail }] }],
        from: { email: senderEmail, name: fromName },
        subject,
        content: [
          { type: 'text/plain', value: textContent || ' ' },
          { type: 'text/html', value: htmlContent },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Email] SendGrid API Error (${res.status}):`, errText);
      throw new Error(`SendGrid API Error: ${errText}`);
    }
    console.log(`[Email] Success: Sent via SendGrid to ${recipientEmail}.`);
    return { success: true };
  }

  // 4. Default / Fallback: Nodemailer SMTP
  const smtpPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const isSecure = smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4, // Force IPv4 socket connection
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const message = {
    from: `${fromName} <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log(`[Email] Success: Message sent to ${recipientEmail}. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email] Critical Failure: Could not send email to ${recipientEmail}`);
    console.error(`[Email] Error details:`, error.message);
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.error(
        '[Email] Hint: If hosted on Render Free Tier, outbound SMTP ports (25, 465, 587) are blocked by the firewall. ' +
        'Set BREVO_API_KEY or RESEND_API_KEY in Render Environment Variables to send emails over HTTPS (port 443).'
      );
    }
    throw error;
  }
};

module.exports = sendEmail;
