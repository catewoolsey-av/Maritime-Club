import { supabase } from '../supabase';

export const CATE_EMAIL = 'cate.woolsey@av.vc';

/**
 * Check if email test mode is currently ON.
 */
export async function isEmailTestMode() {
  const { data: settings } = await supabase
    .from('site_settings')
    .select('email_test_mode')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return settings?.email_test_mode !== false;
}

/**
 * Fetch club branding from site_settings for email templates.
 */
async function getClubBranding() {
  const { data: settings } = await supabase
    .from('site_settings')
    .select('club_name, club_subtitle, primary_color, accent_color')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    name: settings?.club_name || 'Next Gen',
    subtitle: settings?.club_subtitle || 'Venture Club',
    primaryColor: settings?.primary_color || '#1B4D5C',
    accentColor: settings?.accent_color || '#C9A227',
  };
}

/**
 * Fetch all recipient emails (members + club leaders).
 * In test mode, returns only Cate's email.
 */
export async function getNotificationRecipients() {
  const { data: settings } = await supabase
    .from('site_settings')
    .select('email_test_mode')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const testMode = settings?.email_test_mode !== false;

  if (testMode) {
    return [CATE_EMAIL];
  }

  const { data: members } = await supabase
    .from('members')
    .select('email');

  const { data: avTeam } = await supabase
    .from('av_team')
    .select('email')
    .eq('is_active', true);

  const emails = new Set();
  emails.add(CATE_EMAIL);
  (members || []).forEach(m => { if (m.email) emails.add(m.email.trim()); });
  (avTeam || []).forEach(t => { if (t.email) emails.add(t.email.trim()); });

  return [...emails];
}

/**
 * Send an email notification via the Netlify function.
 */
export async function sendNotificationEmail({ to, subject, html, text }) {
  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html, text }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Email send failed:', result);
      return { success: false, error: result.error || 'Failed to send email' };
    }
    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Build the branded email wrapper used by all notification types.
 */
function buildEmailHtml({ brand, portalUrl, headerText, bodyContent }) {
  const primary = brand.primaryColor;
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background-color: ${primary}; padding: 28px 32px; border-radius: 8px 8px 0 0;">
        <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0 0 4px 0; letter-spacing: 0.5px; text-transform: uppercase;">${brand.name} ${brand.subtitle}</p>
        <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">${headerText}</h2>
      </div>
      <!-- Body -->
      <div style="padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        ${bodyContent}
        <!-- CTA -->
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
          <a href="${portalUrl}" style="display: inline-block; padding: 12px 28px; background-color: ${brand.accentColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">View in Portal</a>
        </div>
      </div>
      <!-- Footer -->
      <div style="padding: 16px 32px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">${brand.name} ${brand.subtitle} &middot; <a href="${portalUrl}" style="color: #9ca3af;">Portal</a></p>
      </div>
    </div>
  `;
}

/**
 * Send announcement notification email to all recipients.
 */
export async function sendAnnouncementEmail({ title, content, author }) {
  const recipients = await getNotificationRecipients();
  if (recipients.length === 0) return { success: false, error: 'No recipients' };

  const brand = await getClubBranding();
  const portalUrl = window.location.origin;

  const bodyContent = `
    <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">${title}</h3>
    <div style="color: #374151; white-space: pre-wrap; line-height: 1.7; font-size: 15px;">${content}</div>
    <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">Posted by ${author || 'Admin'}</p>
  `;

  const html = buildEmailHtml({
    brand,
    portalUrl,
    headerText: 'New Announcement',
    bodyContent,
  });

  return sendNotificationEmail({
    to: recipients,
    subject: `${brand.name} - New Announcement: ${title}`,
    html,
    text: `${brand.name} - New Announcement: ${title}\n\n${content}\n\nPosted by ${author || 'Admin'}\n\nView in portal: ${portalUrl}`,
  });
}

/**
 * Send deal posted notification email (when deal is first created).
 */
export async function sendDealPostedEmail({ companyName, headline, sector, stage }) {
  const recipients = await getNotificationRecipients();
  if (recipients.length === 0) return { success: false, error: 'No recipients' };

  const brand = await getClubBranding();
  const portalUrl = window.location.origin;

  const bodyContent = `
    <h3 style="color: #111827; margin: 0 0 8px 0; font-size: 18px;">${companyName}</h3>
    ${headline ? `<p style="color: #6b7280; font-style: italic; margin: 0 0 16px 0; font-size: 15px; line-height: 1.5;">${headline}</p>` : ''}
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f9fafb; border-radius: 6px;">
      ${sector ? `<tr><td style="padding: 10px 16px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px; width: 110px; vertical-align: top;">Sector</td><td style="padding: 10px 16px; color: #111827; font-weight: 500; font-size: 14px;">${sector}</td></tr>` : ''}
      ${stage ? `<tr><td style="padding: 10px 16px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px; width: 110px; vertical-align: top;">Stage</td><td style="padding: 10px 16px; color: #111827; font-weight: 500; font-size: 14px;">${stage}</td></tr>` : ''}
    </table>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">A new deal has been posted to the portal. Log in to view the full details and due diligence materials.</p>
  `;

  const html = buildEmailHtml({
    brand,
    portalUrl,
    headerText: `New Deal: ${companyName}`,
    bodyContent,
  });

  return sendNotificationEmail({
    to: recipients,
    subject: `${brand.name} - New Deal: ${companyName}`,
    html,
    text: `${brand.name} - New Deal: ${companyName}\n${headline || ''}\nSector: ${sector || 'N/A'}\nStage: ${stage || 'N/A'}\n\nA new deal has been posted to the portal. Log in to view the full details.\n\n${portalUrl}`,
  });
}

/**
 * Send deal active notification email (when deal status changes to active).
 */
export async function sendDealActiveEmail({ companyName, headline, sector, stage, raiseAmount, deadline }) {
  const recipients = await getNotificationRecipients();
  if (recipients.length === 0) return { success: false, error: 'No recipients' };

  const brand = await getClubBranding();
  const portalUrl = window.location.origin;

  const bodyContent = `
    <h3 style="color: #111827; margin: 0 0 8px 0; font-size: 18px;">${companyName}</h3>
    ${headline ? `<p style="color: #6b7280; font-style: italic; margin: 0 0 16px 0; font-size: 15px; line-height: 1.5;">${headline}</p>` : ''}
    <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-bottom: 16px;">
      <p style="color: #065f46; font-weight: 600; font-size: 14px; margin: 0;">This deal is now active and open for investment.</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f9fafb; border-radius: 6px;">
      ${sector ? `<tr><td style="padding: 10px 16px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px; width: 130px; vertical-align: top;">Sector</td><td style="padding: 10px 16px; color: #111827; font-weight: 500; font-size: 14px;">${sector}</td></tr>` : ''}
      ${stage ? `<tr><td style="padding: 10px 16px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px; width: 130px; vertical-align: top;">Stage</td><td style="padding: 10px 16px; color: #111827; font-weight: 500; font-size: 14px;">${stage}</td></tr>` : ''}
      ${raiseAmount ? `<tr><td style="padding: 10px 16px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px; width: 130px; vertical-align: top;">Raise Amount</td><td style="padding: 10px 16px; color: #111827; font-weight: 600; font-size: 14px;">${raiseAmount}</td></tr>` : ''}
      ${deadline ? `<tr><td style="padding: 10px 16px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px; width: 130px; vertical-align: top;">Deadline</td><td style="padding: 10px 16px; color: #dc2626; font-weight: 600; font-size: 14px;">${deadline}</td></tr>` : ''}
    </table>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Log in to the portal to review details and express your interest.</p>
  `;

  const html = buildEmailHtml({
    brand,
    portalUrl,
    headerText: `Deal Now Active: ${companyName}`,
    bodyContent,
  });

  return sendNotificationEmail({
    to: recipients,
    subject: `${brand.name} - Deal Now Active: ${companyName}`,
    html,
    text: `${brand.name} - Deal Now Active: ${companyName}\n${headline || ''}\nSector: ${sector || 'N/A'}\nStage: ${stage || 'N/A'}\n${raiseAmount ? `Raise: ${raiseAmount}\n` : ''}${deadline ? `Deadline: ${deadline}\n` : ''}\nThis deal is now active and open for investment.\n\n${portalUrl}`,
  });
}
