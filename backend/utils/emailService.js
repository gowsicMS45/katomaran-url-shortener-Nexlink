const nodemailer = require('nodemailer');

/**
 * Returns true when all required SMTP env vars are present.
 */
function isSmtpConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

/**
 * Sends an email via SMTP (production) or logs to console (development fallback).
 *
 * Environment variables required for real email delivery:
 *   SMTP_HOST  – e.g. smtp.gmail.com
 *   SMTP_PORT  – e.g. 587
 *   SMTP_USER  – Gmail address / SendGrid login
 *   SMTP_PASS  – App-specific password or API key
 *   EMAIL_FROM – Display name + address, e.g. "NexLink <noreply@nexlink.io>"
 */
async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || '"NexLink" <noreply@nexlink.io>';

  if (isSmtpConfigured()) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      const info = await transporter.sendMail({ from, to, subject, text, html });
      console.log(`[EMAIL SERVICE] ✅ Sent to ${to} — Message-ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL SERVICE] ❌ SMTP error: ${err.message}`);
      // Re-throw so callers can surface a proper error to the user
      throw new Error(`Failed to send email: ${err.message}`);
    }
  }

  // ── Development / no-SMTP fallback ──────────────────────────────────────────
  console.log('\n╔══════════════ SIMULATED EMAIL ════════════════╗');
  console.log(`║  To:      ${to}`);
  console.log(`║  Subject: ${subject}`);
  console.log(`║  Body:    ${text}`);
  console.log('╚═══════════════════════════════════════════════╝\n');

  return { success: true, simulated: true };
}

module.exports = { sendEmail, isSmtpConfigured };
