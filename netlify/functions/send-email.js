const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, recipients, subject, text, html } = JSON.parse(event.body);

    // Validate inputs. Either `to` (single/direct send) or `recipients` (a
    // group send — one individual email per address) must be present.
    const recipientList = Array.isArray(recipients) ? recipients.filter(Boolean) : [];
    if ((!to && recipientList.length === 0) || !subject || (!text && !html)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to or recipients, subject, and text/html' })
      };
    }

    // Check if env vars are present
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Missing SMTP config:', {
        host: !!process.env.SMTP_HOST,
        user: !!process.env.SMTP_USER,
        pass: !!process.env.SMTP_PASS,
        port: process.env.SMTP_PORT
      });
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'SMTP configuration incomplete',
          details: 'Server configuration error - please contact administrator'
        })
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const fromAddr = process.env.SMTP_FROM || process.env.SMTP_USER;

    // Group send: deliver ONE personalised email per recipient, each addressed
    // only to that person. Keeps the cohort private (no one sees anyone else)
    // AND shows each member their own address in the To line. Sent in small
    // concurrent batches to stay well under the function timeout without
    // hammering the SMTP server with one connection per recipient.
    if (recipientList.length > 0) {
      console.log('Group send: individual emails to', recipientList.length, 'recipients');
      const BATCH = 5;
      let sent = 0;
      const failures = [];
      for (let i = 0; i < recipientList.length; i += BATCH) {
        const batch = recipientList.slice(i, i + BATCH);
        const results = await Promise.allSettled(batch.map((addr) =>
          transporter.sendMail({ from: fromAddr, to: addr, subject, text, html: html || text })
        ));
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled') sent++;
          else failures.push({ to: batch[idx], error: r.reason?.message || String(r.reason) });
        });
      }
      console.log(`Group send complete: ${sent} sent, ${failures.length} failed`);
      return {
        statusCode: failures.length && sent === 0 ? 500 : 200,
        body: JSON.stringify({ success: sent > 0, sent, failed: failures.length, failures })
      };
    }

    // Single / direct send (deal reminders, AV-staff notifications) — unchanged.
    const toField = Array.isArray(to) ? to.join(', ') : to;
    console.log('Attempting to send email to:', toField);
    const info = await transporter.sendMail({
      from: fromAddr,
      to: toField,
      subject: subject,
      text: text,
      html: html || text
    });

    console.log('Email sent successfully:', info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: info.messageId
      })
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send email',
        details: error.message
      })
    };
  }
};