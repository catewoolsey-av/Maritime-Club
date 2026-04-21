// Initiates LinkedIn OAuth flow
// Redirects the user to LinkedIn's authorization screen

export default async (req, context) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const memberId = url.searchParams.get('member_id');

  if (!memberId) {
    return new Response(JSON.stringify({ error: 'Missing member_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientId = Netlify.env.get('LINKEDIN_CLIENT_ID');
  const redirectUri = Netlify.env.get('LINKEDIN_REDIRECT_URI');

  if (!clientId || !redirectUri) {
    return new Response(JSON.stringify({ error: 'LinkedIn OAuth not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // State parameter encodes member_id so callback can link the profile
  const state = Buffer.from(JSON.stringify({ member_id: memberId })).toString('base64url');

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'openid profile email');

  return new Response(null, {
    status: 302,
    headers: { Location: authUrl.toString() },
  });
};

export const config = {
  path: '/api/linkedin-auth',
};
