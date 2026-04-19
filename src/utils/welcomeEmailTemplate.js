/**
 * Generates a premium, high-fidelity HTML welcome email for new eventeev organisers.
 * @param {string} firstName - The user's first name
 * @returns {string} Full HTML email string
 */
const getWelcomeEmailHtml = (firstName) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to eventeev</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: #f0f2f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body style="background-color:#f0f2f5; padding: 40px 16px;">

  <!-- Email Container -->
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:0 auto;">
    <tr><td>

      <!-- Card Wrapper -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:24px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

        <!-- ── HEADER ── -->
        <tr>
          <td style="padding: 28px 40px 24px; border-bottom: 1px solid #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <img src="https://eventeev.com/logo-black.svg" alt="eventeev" height="28" style="display:block; border:0; outline:none;" />
                </td>
                <td align="right">
                  <span style="font-size:11px; font-weight:600; color:#9CA3AF; letter-spacing:1px; text-transform:uppercase;">Welcome Email</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── HERO ILLUSTRATION ── -->
        <tr>
          <td style="background: linear-gradient(145deg, #FFF7F4 0%, #FFEDE5 50%, #FFF5F0 100%); padding: 48px 40px; text-align:center;">
            <!-- Abstract SVG illustration representing event connectivity -->
            <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Glow background -->
              <ellipse cx="140" cy="110" rx="90" ry="70" fill="url(#glow)" opacity="0.3"/>
              <!-- Orbit ring -->
              <ellipse cx="140" cy="100" rx="85" ry="28" stroke="#EB5017" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4"/>
              <!-- Central sphere -->
              <circle cx="140" cy="100" r="52" fill="url(#sphereGrad)"/>
              <circle cx="140" cy="100" r="52" fill="url(#sphereSheen)" opacity="0.4"/>
              <!-- Sphere highlight -->
              <ellipse cx="124" cy="84" rx="16" ry="10" fill="white" opacity="0.25" transform="rotate(-20 124 84)"/>
              <!-- Calendar icon on sphere -->
              <rect x="124" y="90" width="32" height="28" rx="5" fill="white" opacity="0.95"/>
              <rect x="124" y="90" width="32" height="10" rx="5" fill="#EB5017" opacity="0.9"/>
              <rect x="129" y="107" width="6" height="5" rx="1" fill="#EB5017" opacity="0.7"/>
              <rect x="137" y="107" width="6" height="5" rx="1" fill="#EB5017" opacity="0.7"/>
              <rect x="145" y="107" width="6" height="5" rx="1" fill="#EB5017" opacity="0.7"/>
              <!-- Play button badge -->
              <circle cx="176" cy="80" r="16" fill="white" box-shadow="0 2px 8px rgba(0,0,0,0.1)"/>
              <polygon points="173,75 173,87 183,81" fill="#EB5017"/>
              <!-- Floating dots/nodes -->
              <circle cx="64" cy="88" r="8" fill="#EB5017" opacity="0.85"/>
              <circle cx="220" cy="72" r="6" fill="#FF8C5A" opacity="0.8"/>
              <circle cx="60" cy="138" r="5" fill="#FFC19E" opacity="0.9"/>
              <circle cx="226" cy="130" r="10" fill="#EB5017" opacity="0.6"/>
              <!-- Connection lines -->
              <line x1="72" y1="88" x2="110" y2="96" stroke="#EB5017" stroke-width="1" stroke-dasharray="4 3" opacity="0.4"/>
              <line x1="214" y1="75" x2="178" y2="85" stroke="#EB5017" stroke-width="1" stroke-dasharray="4 3" opacity="0.4"/>
              <line x1="65" y1="133" x2="105" y2="118" stroke="#EB5017" stroke-width="1" stroke-dasharray="4 3" opacity="0.3"/>
              <line x1="218" y1="128" x2="182" y2="116" stroke="#EB5017" stroke-width="1" stroke-dasharray="4 3" opacity="0.3"/>
              <!-- Small triangle decorations -->
              <polygon points="240,55 248,70 232,70" fill="#FF8C5A" opacity="0.5"/>
              <polygon points="38,55 44,67 32,67" fill="#EB5017" opacity="0.3"/>
              <defs>
                <radialGradient id="sphereGrad" cx="40%" cy="35%" r="65%">
                  <stop offset="0%" stop-color="#FF7043"/>
                  <stop offset="60%" stop-color="#EB5017"/>
                  <stop offset="100%" stop-color="#BF360C"/>
                </radialGradient>
                <radialGradient id="sphereSheen" cx="30%" cy="25%" r="50%">
                  <stop offset="0%" stop-color="white" stop-opacity="0.4"/>
                  <stop offset="100%" stop-color="white" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#EB5017" stop-opacity="0.4"/>
                  <stop offset="100%" stop-color="#EB5017" stop-opacity="0"/>
                </radialGradient>
              </defs>
            </svg>
          </td>
        </tr>

        <!-- ── HEADLINE ── -->
        <tr>
          <td style="padding: 40px 40px 8px; text-align:center;">
            <h1 style="font-size:30px; font-weight:900; color:#1B1818; letter-spacing:-0.8px; line-height:1.2;">
              Welcome to eventeev 🎉
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 40px 36px; text-align:center;">
            <p style="font-size:16px; color:#6B7280; font-weight:500; line-height:1.6;">
              Hi <strong style="color:#1B1818;">${firstName}</strong>, you're now part of a platform built to make your events unforgettable. Here's what you can do right now:
            </p>
          </td>
        </tr>

        <!-- ── FEATURE CARDS ── -->
        <tr>
          <td style="padding: 0 32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <!-- Card 1 -->
                <td width="33%" style="padding: 0 8px; vertical-align:top;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA; border:1px solid #F3F4F6; border-radius:16px; overflow:hidden;">
                    <tr>
                      <td style="padding:24px 16px; text-align:center;">
                        <!-- Card 1 icon: Calendar -->
                        <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px auto;">
                          <tr>
                            <td width="48" height="48" align="center" valign="middle" style="background:linear-gradient(135deg,#FFEDE5,#FFC9B0); border-radius:14px;">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="17" rx="3" fill="#EB5017" opacity="0.15"/>
                                <rect x="3" y="4" width="18" height="7" rx="3" fill="#EB5017" opacity="0.8"/>
                                <circle cx="8" cy="15" r="1.5" fill="#EB5017"/>
                                <circle cx="12" cy="15" r="1.5" fill="#EB5017"/>
                                <circle cx="16" cy="15" r="1.5" fill="#EB5017"/>
                                <line x1="8" y1="2" x2="8" y2="6" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                <line x1="16" y1="2" x2="16" y2="6" stroke="white" stroke-width="2" stroke-linecap="round"/>
                              </svg>
                            </td>
                          </tr>
                        </table>
                        <p style="font-size:13px; font-weight:800; color:#1B1818; margin-top:12px; letter-spacing:-0.2px;">Create Your Event</p>
                        <p style="font-size:11px; color:#9CA3AF; margin-top:6px; line-height:1.5; font-weight:500;">Set up your event page with tickets &amp; details</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <!-- Card 2 -->
                <td width="33%" style="padding: 0 8px; vertical-align:top;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA; border:1px solid #F3F4F6; border-radius:16px; overflow:hidden;">
                    <tr>
                      <td style="padding:24px 16px; text-align:center;">
                        <!-- Card 2 icon: QR Scan -->
                        <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px auto;">
                          <tr>
                            <td width="48" height="48" align="center" valign="middle" style="background:linear-gradient(135deg,#FFEDE5,#FFC9B0); border-radius:14px;">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#EB5017" stroke-width="1.8" fill="none"/>
                                <rect x="5" y="5" width="3" height="3" rx="0.5" fill="#EB5017"/>
                                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#EB5017" stroke-width="1.8" fill="none"/>
                                <rect x="5" y="16" width="3" height="3" rx="0.5" fill="#EB5017"/>
                                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#EB5017" stroke-width="1.8" fill="none"/>
                                <rect x="16" y="5" width="3" height="3" rx="0.5" fill="#EB5017"/>
                                <line x1="14" y1="14" x2="14" y2="17" stroke="#EB5017" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="14" y1="17" x2="17" y2="17" stroke="#EB5017" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="21" y1="14" x2="21" y2="17" stroke="#EB5017" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="18" y1="21" x2="21" y2="21" stroke="#EB5017" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="21" y1="17" x2="21" y2="21" stroke="#EB5017" stroke-width="1.8" stroke-linecap="round"/>
                              </svg>
                            </td>
                          </tr>
                        </table>
                        <p style="font-size:13px; font-weight:800; color:#1B1818; margin-top:12px; letter-spacing:-0.2px;">Sleek Check-ins</p>
                        <p style="font-size:11px; color:#9CA3AF; margin-top:6px; line-height:1.5; font-weight:500;">Scan QR codes &amp; verify attendees instantly at the door</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <!-- Card 3 -->
                <td width="33%" style="padding: 0 8px; vertical-align:top;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA; border:1px solid #F3F4F6; border-radius:16px; overflow:hidden;">
                    <tr>
                      <td style="padding:24px 16px; text-align:center;">
                        <!-- Card 3 icon: Analytics -->
                        <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px auto;">
                          <tr>
                            <td width="48" height="48" align="center" valign="middle" style="background:linear-gradient(135deg,#FFEDE5,#FFC9B0); border-radius:14px;">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="13" width="4" height="7" rx="1.5" fill="#EB5017" opacity="0.5"/>
                                <rect x="10" y="9" width="4" height="11" rx="1.5" fill="#EB5017" opacity="0.75"/>
                                <rect x="16" y="5" width="4" height="15" rx="1.5" fill="#EB5017"/>
                                <line x1="3" y1="21" x2="21" y2="21" stroke="#EB5017" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
                              </svg>
                            </td>
                          </tr>
                        </table>
                        <p style="font-size:13px; font-weight:800; color:#1B1818; margin-top:12px; letter-spacing:-0.2px;">Analytics Dashboard</p>
                        <p style="font-size:11px; color:#9CA3AF; margin-top:6px; line-height:1.5; font-weight:500;">Track check-ins, revenue &amp; attendee insights live</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── PRO TIP ── -->
        <tr>
          <td style="padding: 0 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFF7F4,#FFEDE5); border:1px solid #FFD5C2; border-radius:16px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="font-size:13px; color:#AD3307; font-weight:700; letter-spacing:0.5px; margin-bottom:6px;">💡 PRO TIP</p>
                  <p style="font-size:13px; color:#7C2D12; font-weight:500; line-height:1.6;">
                    Events with a detailed description and a high-quality banner image see a <strong>30% higher registration rate</strong>. Make yours stand out!
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── CTA BUTTON ── -->
        <tr>
          <td style="padding: 0 40px 48px; text-align:center;">
            <a href="https://eventeev.com/events" style="display:inline-block; background:linear-gradient(135deg,#EB5017,#D44210); color:white; text-decoration:none; font-size:15px; font-weight:800; padding:17px 48px; border-radius:100px; letter-spacing:0.2px; box-shadow: 0 8px 24px rgba(235,80,23,0.35);">
              Go to Dashboard &rarr;
            </a>
            <p style="font-size:12px; color:#9CA3AF; margin-top:16px; font-weight:500;">
              Need help? <a href="mailto:support@eventeev.com" style="color:#EB5017; text-decoration:none; font-weight:600;">Contact Support</a>
            </p>
          </td>
        </tr>

        <!-- ── DIVIDER ── -->
        <tr>
          <td style="padding: 0 40px;">
            <hr style="border:none; border-top: 1px solid #F3F4F6;" />
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <img src="https://eventeev.com/logo-black.svg" alt="eventeev" height="22" style="display:block; border:0; outline:none;" />
                  <p style="font-size:11px; color:#9CA3AF; margin-top:4px; font-weight:500; line-height:1.5;">
                    Making events unforgettable, one platform at a time.<br>
                    Lagos, Nigeria &bull; hello@eventeev.com
                  </p>
                </td>
                <td align="right" valign="middle">
                  <!-- Social Icons -->
                  <a href="https://twitter.com/eventeev" style="display:inline-block; margin-left:10px;">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="10" fill="#F3F4F6"/>
                      <path d="M22 11a6.5 6.5 0 01-1.9.5 3.3 3.3 0 001.4-1.8 6.6 6.6 0 01-2.1.8A3.3 3.3 0 0013.8 14c0 .3 0 .5.1.7A9.3 9.3 0 0110 11.5a3.3 3.3 0 001 4.4 3.2 3.2 0 01-1.5-.4v.1a3.3 3.3 0 002.6 3.2 3.3 3.3 0 01-1.5.1 3.3 3.3 0 003.1 2.3A6.6 6.6 0 0110 22a9.3 9.3 0 005 1.5c6.1 0 9.4-5 9.4-9.4v-.4A6.7 6.7 0 0022 11z" fill="#6B7280"/>
                    </svg>
                  </a>
                  <a href="https://linkedin.com/company/eventeev" style="display:inline-block; margin-left:10px;">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="10" fill="#F3F4F6"/>
                      <path d="M11 13h-2v8h2v-8zm-1-3.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm4.5 3.5H12.5v8H14.5v-4.2c0-.9.7-1.6 1.5-1.6s1.5.7 1.5 1.6V21H19.5v-4.5c0-2-1.5-3.5-3.5-3.5-.8 0-1.5.3-2 .8V13z" fill="#6B7280"/>
                    </svg>
                  </a>
                  <a href="https://instagram.com/eventeev" style="display:inline-block; margin-left:10px;">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="10" fill="#F3F4F6"/>
                      <rect x="8" y="8" width="16" height="16" rx="4.5" stroke="#6B7280" stroke-width="1.5" fill="none"/>
                      <circle cx="16" cy="16" r="3.5" stroke="#6B7280" stroke-width="1.5" fill="none"/>
                      <circle cx="20.5" cy="11.5" r="1" fill="#6B7280"/>
                    </svg>
                  </a>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
              <tr>
                <td style="text-align:center;">
                  <p style="font-size:11px; color:#9CA3AF; font-weight:500;">
                    <a href="#" style="color:#9CA3AF; text-decoration:none;">Unsubscribe</a>
                    &nbsp;&bull;&nbsp;
                    <a href="https://eventeev.com/privacy" style="color:#9CA3AF; text-decoration:none;">Privacy Policy</a>
                    &nbsp;&bull;&nbsp;
                    <a href="https://eventeev.com/help" style="color:#9CA3AF; text-decoration:none;">Help Center</a>
                  </p>
                  <p style="font-size:10px; color:#D1D5DB; margin-top:8px; font-weight:500;">
                    &copy; ${new Date().getFullYear()} eventeev. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!-- / Card Wrapper -->

    </td></tr>
  </table>
  <!-- / Email Container -->

</body>
</html>
`;

module.exports = getWelcomeEmailHtml;
