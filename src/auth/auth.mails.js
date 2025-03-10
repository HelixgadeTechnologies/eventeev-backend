const nodemailer = require("nodemailer");
require("dotenv").config();

// Configure the email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send Welcome Email
exports.sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Welcome to EazzyReg!",
      html: `
        <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Account Created Successfully</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
          <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td align="center">
                <table width="600" cellspacing="0" cellpadding="20" border="0" style="background: #fff; margin: 30px auto; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                  <!-- Logo -->
                  <tr>
                    <td align="center">
                      <img src="https://res.cloudinary.com/dygn4o3nv/image/upload/v1741174074/image_2_idzj64.png" alt="EazzyReg 2025" style="width: 125px; height: 28px" />
                    </td>
                  </tr>
                  <!-- Heading -->
                  <tr>
                    <td align="center">
                      <h2 style="font-weight: 600; font-size: 20px; line-height: 28px; color: #1681bb;">Welcome to EazzyReg, ${name}!</h2>
                      <p style="font-size: 14px; color: #1681bb"><i>Hassle-Free Car Renewal Starts Here!</i></p>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td>
                      <p style="font-size: 14px">Hello ${name},</p>
                      <p>Welcome to EazzyReg! We're so glad you stopped by.</p>
                      <p>We make car paper registration and renewal <strong style="color: #1681bb">quick, easy, and stress-free</strong>. No more long queues or complicated processes - just a smooth, efficient way to keep your vehicle legal and road-ready.</p>
                      <h4 style="color: #1681bb">Here's what you can do next:</h4>
                      <ol>
                        <li><i>Complete Your Profile</i> - Ensure your details are up to date for a seamless process.</li>
                        <li><i>Apply for Services</i> - Easily request new licenses, renewals, or transfers.</li>
                        <li><i>Make Transactions</i> - Place order for paper registration and renewal.</li>
                      </ol>
                      <p>Having trouble? Feel free to contact us at <a href="mailto:support@eazzyreg.com" style="color: #1681bb">support@eazzyreg.com</a> or visit our website <a href="https://eazzyreg.org" style="color: #1681bb">www.eazzyreg.org</a>.</p>
                      <p style="font-size: 14px; color: #1681bb"><i>Thank you for signing up - we look forward to serving you.</i></p>
                      <div style="text-align: center; margin-top: 20px">
                        <a href="https://eazzyregfrontend-1.onrender.com" style="background: #1681bb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Go to Dashboard</a>
                      </div>
                      <p>Best Regards,<br /><span style="color: #1681bb; font-weight: 600">The EazzyReg Team.</span></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

// Send OTP Verification Email
exports.sendOtpVerificationEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Reset Your Password",
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-image: url(https://res.cloudinary.com/dygn4o3nv/image/upload/v1741175927/Background_Image_rhk41j.png); height: auto; margin: 0; padding: 0;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td align="center">
                  <table width="600" cellspacing="0" cellpadding="20" border="0" style="margin: 60px auto; border-radius: 10px;">
                    <!-- Logo -->
                    <tr>
                      <td align="center">
                        <img src="https://res.cloudinary.com/dygn4o3nv/image/upload/v1741174074/image_2_idzj64.png" alt="EazzyReg 2025" style="width: 125px; height: 28px;">
                      </td>
                    </tr>
                    <!-- Heading -->
                    <tr>
                      <td align="center">
                        <h2 style="font-weight: 600; font-size: 20px; line-height: 28px; color: #1681bb;">Reset Your Password</h2>
                        <p style="font-size: 14px; color: #1681bb;"><i>Use the code below to reset your password.</i></p>
                      </td>
                    </tr>
                    <!-- OTP Code -->
                    <tr>
                      <td align="center" style="font-size: 24px; font-weight: bold; color: #1681bb;">
                        ${otp}
                      </td>
                    </tr>
                    <!-- Instructions -->
                    <tr>
                      <td>
                        <p style="font-size: 14px;">Hello</p>
                        <p>You have requested to reset your password. Use the OTP above to proceed.</p>
                        <p>If you did not request this, please ignore this email or contact our support team.</p>
                        <p>Having trouble? Feel free to contact us at <a href="mailto:support@eazzyreg.com" style="color: #1681bb;">support@eazzyreg.com</a>.</p>
                        <p>Best Regards,<br><span style="color: #1681bb; font-weight: 600;">The EazzyReg Team.</span></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

// Send Password Reset Email
exports.sendPasswordResetEmail = async (email) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Password Reset Successful",
      html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Password Reset Successful</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; background-image: url(https://res.cloudinary.com/dygn4o3nv/image/upload/v1741175927/Background_Image_rhk41j.png);">
          <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td align="center">
                <table width="600" cellspacing="0" cellpadding="20" border="0" style="margin: 60px auto; border-radius: 10px;">
                  <!-- Logo -->
                  <tr>
                    <td align="center">
                      <img src="https://res.cloudinary.com/dygn4o3nv/image/upload/v1741174074/image_2_idzj64.png" alt="EazzyReg 2025" style="width: 125px; height: 28px;">
                    </td>
                  </tr>
                  <!-- Heading -->
                  <tr>
                    <td align="center">
                      <h2 style="font-weight: 600; font-size: 20px; line-height: 28px; color: #1681bb;">Password Reset Successful</h2>
                      <p style="font-size: 14px; color: #1681bb;"><i>Your password has been updated securely.</i></p>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td>
                      <p style="font-size: 14px;">Hello</p>
                      <p>We're just letting you know that your password has been successfully updated.</p>
                      <p>If you didn't request this change, please contact our support team immediately at <a href="mailto:support@eazzyreg.com" style="color: #1681bb;">support@eazzyreg.com</a>.</p>
                      <p>For security purposes, we recommend using a strong password and never sharing your login details.</p>
                      <div style="text-align: center; margin-top: 20px;">
                        <a href="#" style="background: #1681bb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Go to Login</a>
                      </div>
                      <p>Best Regards,<br><span style="color: #1681bb; font-weight: 600;">The EazzyReg Team.</span></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
