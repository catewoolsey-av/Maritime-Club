# Magic Link Password Reset Setup

This update adds magic link password reset functionality to the NextGen Club portal.

## Setup Steps

### 1. Run Database Migration

Go to your Supabase dashboard → SQL Editor and run the contents of:
```
migrations/001_password_resets.sql
```

This creates the `password_resets` table to store reset tokens.

### 2. Set Up Resend (Email Service)

1. Go to [resend.com](https://resend.com) and create a free account
2. Get your API key from the dashboard
3. Add the API key to your Netlify environment variables:
   - Go to Netlify → Site Settings → Environment Variables
   - Add: `RESEND_API_KEY` = your_api_key_here

### 3. (Optional) Custom Email Domain

By default, emails will be sent from `onboarding@resend.dev` (Resend's test domain).

To send from your own domain (e.g., `noreply@av.vc`):
1. In Resend, go to Domains → Add Domain
2. Follow DNS verification steps
3. Add to Netlify env vars: `RESEND_FROM_EMAIL` = `AV NextGen Club <noreply@yourdomain.com>`

### 4. Deploy

Push the code changes to trigger a new Netlify deploy.

## How It Works

1. **User clicks "Forgot password?"** → Enters their email
2. **System generates secure token** → Stores in `password_resets` table with 1-hour expiry
3. **Email sent via Resend** → Contains magic link like `yoursite.com?reset_token=abc123`
4. **User clicks link** → Token is validated, user sets new password
5. **Token marked as used** → Cannot be reused

## Security Features

- Tokens expire after 1 hour
- Tokens can only be used once
- Email enumeration protection (same response whether email exists or not)
- Old tokens deleted when new one is requested
- RLS policies restrict direct database access

## Testing

Before setting up Resend, you can test the flow:
1. The serverless function will log the token to Netlify function logs
2. Check Netlify → Functions → `send-reset-email` logs to see the token
3. Manually construct URL: `yoursite.com?reset_token=TOKEN_FROM_LOGS`

## Files Added/Modified

- `netlify/functions/send-reset-email.js` - Sends reset emails
- `netlify/functions/reset-password.js` - Validates tokens & resets passwords
- `migrations/001_password_resets.sql` - Database table
- `src/App.jsx` - Updated MemberLogin component with magic link flow
