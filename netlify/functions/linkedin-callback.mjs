// LinkedIn OAuth callback handler
// Exchanges auth code for access token, fetches profile, saves photo to Supabase Storage
// Uses raw fetch against Supabase REST + Storage APIs (zero npm dependencies)

export default async (req, context) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const siteUrl = Netlify.env.get('URL') || Netlify.env.get('DEPLOY_PRIME_URL') || 'http://localhost:8888';

  // User denied consent or LinkedIn returned an error
  if (error) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${siteUrl}/?linkedin=denied` },
    });
  }

  if (!code || !state) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${siteUrl}/?linkedin=error&reason=missing_params` },
    });
  }

  // Decode state to get member_id
  let memberId;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    memberId = decoded.member_id;
  } catch {
    return new Response(null, {
      status: 302,
      headers: { Location: `${siteUrl}/?linkedin=error&reason=invalid_state` },
    });
  }

  const clientId = Netlify.env.get('LINKEDIN_CLIENT_ID');
  const clientSecret = Netlify.env.get('LINKEDIN_CLIENT_SECRET');
  const redirectUri = Netlify.env.get('LINKEDIN_REDIRECT_URI');
  const supabaseUrl = Netlify.env.get('SUPABASE_URL');
  const supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('LinkedIn token exchange failed:', errBody);
      return new Response(null, {
        status: 302,
        headers: { Location: `${siteUrl}/?linkedin=error&reason=token_exchange&detail=${encodeURIComponent(errBody.substring(0, 200))}` },
      });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from LinkedIn's OpenID Connect userinfo endpoint
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      const errBody = await profileRes.text();
      console.error('LinkedIn profile fetch failed:', errBody);
      return new Response(null, {
        status: 302,
        headers: { Location: `${siteUrl}/?linkedin=error&reason=profile_fetch&detail=${encodeURIComponent(errBody.substring(0, 200))}` },
      });
    }

    const profile = await profileRes.json();
    // profile: { sub, name, given_name, family_name, picture, email, email_verified, locale }

    // 3. Download LinkedIn photo and upload to Supabase Storage via REST API
    let storedPhotoUrl = null;

    if (profile.picture) {
      try {
        const photoRes = await fetch(profile.picture);
        if (photoRes.ok) {
          const photoBuffer = await photoRes.arrayBuffer();
          const contentType = photoRes.headers.get('content-type') || 'image/jpeg';
          const ext = contentType.includes('png') ? 'png' : 'jpg';
          const filePath = `profile-photos/linkedin_${memberId}_${Date.now()}.${ext}`;

          const uploadRes = await fetch(
            `${supabaseUrl}/storage/v1/object/profile-photos/${filePath}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': contentType,
                'Cache-Control': '3600',
                'x-upsert': 'true',
              },
              body: photoBuffer,
            }
          );

          if (uploadRes.ok) {
            storedPhotoUrl = `${supabaseUrl}/storage/v1/object/public/profile-photos/${filePath}`;
          } else {
            console.error('Photo upload error:', await uploadRes.text());
          }
        }
      } catch (photoErr) {
        console.error('Photo download error:', photoErr);
        // Non-fatal — continue without photo
      }
    }

    // 4. Get existing member data to decide what to overwrite
    const memberRes = await fetch(
      `${supabaseUrl}/rest/v1/members?id=eq.${memberId}&select=photo_url,full_name,email,is_manager`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const memberRows = await memberRes.json();
    const existing = memberRows?.[0] || {};

    // 5. Build update payload
    const updateData = {
      linkedin_connected: true,
      linkedin_sub: profile.sub,
      linkedin_name: profile.name,
      linkedin_connected_at: new Date().toISOString(),
    };

    if (storedPhotoUrl) {
      updateData.linkedin_photo_url = storedPhotoUrl;
      // Only set main photo if member has no existing photo
      if (!existing.photo_url) {
        updateData.photo_url = storedPhotoUrl;
      }
    }

    // Only set name if member has no existing name
    if (profile.name && !existing.full_name) {
      updateData.full_name = profile.name;
    }

    // 6. Update member via Supabase REST API
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/members?id=eq.${memberId}`,
      {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateRes.ok) {
      const updateErr = await updateRes.text();
      console.error('Member update error:', updateErr);
      return new Response(null, {
        status: 302,
        headers: { Location: `${siteUrl}/?linkedin=error&reason=db_update&detail=${encodeURIComponent(updateErr.substring(0, 200))}` },
      });
    }

    // 7. If member is an AV team manager, also update av_team table
    if (existing.is_manager && existing.email && storedPhotoUrl) {
      await fetch(
        `${supabaseUrl}/rest/v1/av_team?email=eq.${encodeURIComponent(existing.email)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ photo_url: storedPhotoUrl }),
        }
      );
    }

    // Access token is NOT stored — single use, then discarded
    return new Response(null, {
      status: 302,
      headers: { Location: `${siteUrl}/?linkedin=connected` },
    });

  } catch (err) {
    console.error('LinkedIn callback error:', err);
    return new Response(null, {
      status: 302,
      headers: { Location: `${siteUrl}/?linkedin=error&reason=unknown&detail=${encodeURIComponent(String(err.message || err).substring(0, 200))}` },
    });
  }
};

export const config = {
  path: '/api/linkedin-callback',
};
