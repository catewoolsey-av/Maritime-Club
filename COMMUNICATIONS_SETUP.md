# Communications Feature Setup

This guide covers setting up the Email and SMS communications feature for NextGen Club.

## Overview

The Communications feature allows admins to send messages to club members via:
- **Email** (via Resend - already configured)
- **SMS** (via Twilio - new setup required)

---

## Step 1: Database Migration

Run the following SQL in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open file: `migrations/002_communications.sql`
3. Copy and run the entire script

This creates:
- `announcement_templates` table
- `announcements` table (sent message log)
- `announcement_recipients` table (delivery tracking)
- Adds `preferred_contact` column to members

---

## Step 2: Create Supabase Storage Bucket

For file attachments:

1. Go to Supabase Dashboard → **Storage**
2. Click **New Bucket**
3. Bucket name: `announcement-attachments`
4. Check **Public bucket**
5. Click **Create bucket**
6. Click on the bucket → **Policies** → **New Policy**
7. Select "Allow access to all users" for SELECT
8. Add another policy for INSERT with authenticated users

---

## Step 3: Twilio Account Setup

### 3.1 Create Twilio Account

1. Go to: https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Verify your email and phone number

### 3.2 Get Your Credentials

After sign-up:

1. Go to Twilio Console: https://console.twilio.com
2. On the main dashboard, find:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)
3. Copy both values

### 3.3 Get a Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Search for a number in your country
3. Select a number with **SMS** capability
4. Click **Buy** (~$1.15/month for US numbers)
5. Copy the phone number (format: +1234567890)

### 3.4 (Optional) Upgrade from Trial

Trial limitations:
- Can only send to verified numbers
- Messages include "Sent from Twilio trial account"

To send to any number:
1. Go to **Billing** → **Upgrade**
2. Add a credit card
3. Add funds ($20 minimum)

---

## Step 4: Add Environment Variables to Netlify

1. Go to Netlify → Your site → **Site configuration**
2. Click **Environment variables**
3. Add these variables:

| Key | Value | Example |
|-----|-------|---------|
| `TWILIO_ACCOUNT_SID` | Your Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Your Auth Token | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER` | Your Twilio number | `+15551234567` |

4. Click **Save**
5. Trigger a new deploy: **Deploys** → **Trigger deploy**

---

## Step 5: Verify Setup

1. Go to Admin → **Communications**
2. Click **Compose Message**
3. Select 1-2 test recipients (yourself)
4. Check both Email and SMS
5. Send a test message
6. Verify delivery

---

## Usage Guide

### Sending a Message

1. **Admin** → **Communications** → **Compose Message**
2. **Template**: Select a pre-built template or start from scratch
3. **Recipients**: 
   - Use filters (sector, experience, RSVP status)
   - Select All or individual members
4. **Channels**: Check Email and/or SMS
5. **Subject**: Email subject line (also used for SMS)
6. **Message**: 
   - Use `{{member_name}}` for personalization
   - Use `**text**` for bold (email only)
7. **Attachment**: Optional file (email only)
8. Click **Send Message**

### Templates

Pre-built templates:
- **New Deal Alert**: For announcing new investment opportunities
- **Session Reminder**: For upcoming session reminders
- **General Announcement**: For general communications

Variables available:
- `{{member_name}}` - Recipient's full name
- `{{company_name}}` - Company name (for deal alerts)
- `{{session_title}}` - Session title (for reminders)

### History

View sent communications:
- Click **History** to see all past messages
- Shows: subject, recipients count, channels, status, date

---

## Costs

### Email (Resend)
- Free: 100 emails/day, 3,000/month
- Paid: $20/month for 50,000 emails

### SMS (Twilio)
- Phone number: ~$1.15/month
- US SMS: ~$0.0079 per message
- International: Varies by country

Example: 20 members × 4 messages/month = 80 SMS = ~$0.63/month

---

## Troubleshooting

### SMS Not Sending

1. Check Twilio credentials in Netlify
2. Ensure phone number is in E.164 format (+1234567890)
3. Check Twilio console for error logs
4. Trial accounts can only send to verified numbers

### Email Not Sending

1. Check RESEND_API_KEY in Netlify
2. Verify recipient email is valid
3. Check Resend dashboard for bounces/errors

### Attachment Upload Failed

1. Check file size (max 25MB)
2. Verify storage bucket exists and is public
3. Check Supabase storage policies

---

## Future: WhatsApp Setup

WhatsApp via Twilio requires additional steps:
1. Meta Business verification
2. WhatsApp Business API approval
3. Message template approval

This is more complex and can be added later if needed.
