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

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Port 587 with STARTTLS (port 465 is blocked on Render)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4, // Force IPv4 socket connection
    connectionTimeout: 15000, 
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  const message = {
    from: `${process.env.FROM_NAME || 'Eventeev'} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message || options.text || '',
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log(`[Email] Success: Message sent to ${options.email}. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email] Critical Failure: Could not send email to ${options.email}`);
    console.error(`[Email] Error details:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
