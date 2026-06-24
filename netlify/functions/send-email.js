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
    const { to, bcc, subject, text, html } = JSON.parse(event.body);

    // Validate inputs. Either `to` or `bcc` must be present — group sends use
    // bcc so recipients can't see each other's addresses.
    if ((!to && !bcc) || !subject || (!text && !html)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to or bcc, subject, and text/html' })
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
    const joinAddrs = (v) => (Array.isArray(v) ? v.join(', ') : v);
    // When a send only supplies bcc (group blast), put the club's own sending
    // address in the visible To so recipients see the club, not each other.
    const toField = to ? joinAddrs(to) : fromAddr;

    console.log('Attempting to send email', { to: toField, bccCount: Array.isArray(bcc) ? bcc.length : bcc ? 1 : 0 });

    // Send email
    const info = await transporter.sendMail({
      from: fromAddr,
      to: toField,
      ...(bcc ? { bcc: joinAddrs(bcc) } : {}),
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