const nodemailer = require('nodemailer');

/**
 * Sends an email using SMTP if configured in .env, otherwise logs the email content to console.
 * 
 * Configurable Environment Variables:
 * - SMTP_HOST: The hostname of the SMTP server (e.g. smtp.gmail.com or smtp.sendgrid.net)
 * - SMTP_PORT: The port number (usually 587 or 465)
 * - SMTP_USER: Username/email address for authentication
 * - SMTP_PASS: Password or app-specific password
 * - EMAIL_FROM: The sender email address (e.g. "NexLink <noreply@nexlink.io>")
 */
async function sendEmail({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || 'NexLink <noreply@nexlink.io>';

  // Check if SMTP is configured
  if (host && port && user && pass) {
    try {
      console.log(`[EMAIL SERVICE] Sending real email to ${to} using SMTP...`);
      
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      console.log(`[EMAIL SERVICE] Real email sent successfully! Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[EMAIL SERVICE ERROR] Failed to send real email via SMTP: ${error.message}`);
      console.log(`[EMAIL SERVICE FALLBACK] Falling back to console simulation.`);
    }
  }

  // Fallback / Simulation Log (default development behavior)
  console.log('\n=== SIMULATED EMAIL OUTBOX ======================');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text:    ${text}`);
  console.log('==================================================\n');
  
  return { success: true, simulated: true };
}

module.exports = {
  sendEmail,
};
