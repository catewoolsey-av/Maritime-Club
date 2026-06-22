import { createClient } from '@supabase/supabase-js';

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const getSb1 = () =>
  createClient(
    Netlify.env.get('SUPABASE_URL'),
    Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

const getSb2 = () =>
  createClient(
    Netlify.env.get('SUPABASE_2_URL'),
    Netlify.env.get('SUPABASE_2_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

async function findOrCreateSb2UserByEmail(sb2, email, fullName) {
  const { data: existing } = await sb2
    .from('users')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  if (existing) return existing.id;

  const parts = (fullName || '').trim().split(/\s+/);
  const { data: created, error } = await sb2
    .from('users')
    .insert([{ email, first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' }])
    .select('id')
    .single();
  if (error) throw new Error(`Failed to create SB2 user: ${error.message}`);
  return created.id;
}

async function authenticateAdmin(sb1, device_id) {
  if (!device_id) return { error: 'Missing device_id' };

  const { data: session } = await sb1
    .from('admin_sessions')
    .select('id')
    .eq('device_id', device_id)
    .eq('is_active', true)
    .maybeSingle();

  if (!session) return { error: 'Not authorized' };
  return { ok: true };
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = await req.json();
    const { device_id, action, clubSlug } = body;

    const sb1 = getSb1();
    const auth = await authenticateAdmin(sb1, device_id);
    if (auth.error) return json(401, { error: auth.error });

    const sb2 = getSb2();

    // Resolve club_id once per request. dr_responses are scoped to a club so
    // a member's decision in one portal doesn't bleed into another.
    const clubId = await (async () => {
      if (!clubSlug) return null;
      const { data } = await sb2.from('clubs').select('id').eq('slug', clubSlug).maybeSingle();
      return data?.id || null;
    })();

    if (action === 'listSourceDeals') {
      const { data, error } = await sb2
        .from('deals')
        .select('id, name, company_name, company_url, headline, deck_url, deal_status, stage, created_at, deadline_at, is_uk')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return json(200, { deals: data || [] });
    }

    if (action === 'getDealDetail') {
      const { sourceDealId } = body;
      if (!sourceDealId) return json(400, { error: 'Missing sourceDealId' });

      const [dealRes, termsRes] = await Promise.all([
        sb2.from('deals').select('description, deadline_at').eq('id', sourceDealId).maybeSingle(),
        sb2.from('dr_deal_terms').select('*').eq('deal_id', sourceDealId).maybeSingle(),
      ]);

      let terms = termsRes.data || null;
      if (terms?.company_image_path && !/^https?:\/\//i.test(terms.company_image_path)) {
        const { data: signed, error: signErr } = await sb2.storage
          .from('deal-materials')
          .createSignedUrl(terms.company_image_path, 3600);
        if (signErr) {
          console.warn(`Failed to sign company image for deal ${sourceDealId} (path=${terms.company_image_path}):`, signErr.message);
          terms = { ...terms, company_image_path: null };
        } else {
          terms = { ...terms, company_image_path: signed?.signedUrl || null };
        }
      }

      return json(200, {
        description: dealRes.data?.description || null,
        deadline_at: dealRes.data?.deadline_at || null,
        terms,
      });
    }

    if (action === 'getDealMaterials') {
      const { sourceDealId } = body;
      if (!sourceDealId) return json(400, { error: 'Missing sourceDealId' });

      const { data: materials, error } = await sb2
        .from('deal_materials')
        .select('*')
        .eq('deal_id', sourceDealId)
        .order('sort_order', { ascending: true });
      if (error) throw error;

      const withUrls = await Promise.all(
        (materials || []).map(async (m) => {
          if (m.storage_path) {
            const { data: signed } = await sb2.storage
              .from('deal-materials')
              .createSignedUrl(m.storage_path, 3600);
            return { ...m, signed_url: signed?.signedUrl || null };
          }
          return { ...m, signed_url: m.url || null };
        })
      );

      return json(200, { materials: withUrls });
    }

    if (action === 'incrementReminder') {
      const { responseId } = body;
      if (!responseId) return json(400, { error: 'Missing responseId' });

      const { data: current, error: readErr } = await sb2
        .from('dr_responses')
        .select('reminders_sent')
        .eq('id', responseId)
        .maybeSingle();
      if (readErr) throw readErr;
      if (!current) return json(404, { error: 'Response not found' });

      const next = (current.reminders_sent || 0) + 1;
      const { error: updErr } = await sb2
        .from('dr_responses')
        .update({ reminders_sent: next })
        .eq('id', responseId);
      if (updErr) throw updErr;
      return json(200, { reminders_sent: next });
    }

    if (action === 'updateResponse') {
      const { responseId, decision, desiredAmount, reason } = body;
      if (!responseId) return json(400, { error: 'Missing responseId' });
      if (decision !== 'invest' && decision !== 'pass') {
        return json(400, { error: 'Invalid decision' });
      }
      // pass = no amount; invest can have a numeric amount or null (Max)
      const amount = decision === 'pass' ? null : (desiredAmount ?? null);
      const now = new Date().toISOString();
      const patch = {
        decision,
        desired_amount: amount,
        updated_at: now,
      };
      // Only touch reason if the client sent it (undefined = leave as-is).
      if (reason !== undefined) patch.reason = reason || null;

      // Stamp submitted_at if the row doesn't have one yet (admin first to
      // record a decision for someone who never submitted themselves).
      const { data: existing } = await sb2
        .from('dr_responses')
        .select('submitted_at')
        .eq('id', responseId)
        .maybeSingle();
      if (!existing?.submitted_at) patch.submitted_at = now;

      const { error: updErr } = await sb2
        .from('dr_responses')
        .update(patch)
        .eq('id', responseId);
      if (updErr) throw updErr;
      return json(200, { success: true });
    }

    if (action === 'upsertResponseForMember') {
      // Admin recording a response on behalf of a member who hasn't submitted
      // one themselves yet (or replacing an existing one). Auto-creates the
      // SB2 user if missing so members who've never logged into the deal room
      // can still have their decision logged.
      const { sourceDealId, email, fullName, decision, desiredAmount, reason } = body;
      if (!sourceDealId || !email) return json(400, { error: 'Missing sourceDealId or email' });
      if (decision !== 'invest' && decision !== 'pass') {
        return json(400, { error: 'Invalid decision' });
      }
      if (!clubId) return json(400, { error: 'Missing or invalid clubSlug' });
      const cleanEmail = String(email).toLowerCase().trim();
      const userId = await findOrCreateSb2UserByEmail(sb2, cleanEmail, fullName);

      // Look up an existing row scoped to this club (same user can have a
      // separate response per club).
      const { data: existing } = await sb2
        .from('dr_responses')
        .select('id, submitted_at')
        .eq('deal_id', sourceDealId)
        .eq('user_id', userId)
        .eq('club_id', clubId)
        .maybeSingle();

      const amount = decision === 'pass' ? null : (desiredAmount ?? null);
      const now = new Date().toISOString();

      if (existing) {
        const patch = { decision, desired_amount: amount, updated_at: now };
        if (!existing.submitted_at) patch.submitted_at = now;
        if (reason !== undefined) patch.reason = reason || null;
        const { error } = await sb2.from('dr_responses').update(patch).eq('id', existing.id);
        if (error) throw error;
        return json(200, { success: true, id: existing.id, updated: true });
      }

      const { data: inserted, error } = await sb2
        .from('dr_responses')
        .insert([{
          deal_id: sourceDealId,
          user_id: userId,
          club_id: clubId,
          decision,
          desired_amount: amount,
          reason: reason || null,
          submitted_at: now,
          reminders_sent: 0,
        }])
        .select('id')
        .single();
      if (error) throw error;
      return json(200, { success: true, id: inserted.id, updated: false });
    }

    if (action === 'pushMeetingToSb2') {
      // Mirror a portal meeting to SB2 so cross-club tools (ClubManagementCW
      // member-engagement views etc.) can read attendance + per-member notes.
      // Source of truth stays on SB1; this is best-effort sync.
      const {
        clubSlug,
        sourceSessionId,
        title,
        meetingType,
        hostName,
        scheduledAt,
        generalNotes,
        members, // [{ email, fullName, attended, participated, memberNote }]
      } = body;
      if (!clubSlug || !sourceSessionId) {
        return json(400, { error: 'Missing clubSlug or sourceSessionId' });
      }

      // Resolve club_id via slug.
      const { data: club, error: clubErr } = await sb2
        .from('clubs')
        .select('id')
        .eq('slug', clubSlug)
        .maybeSingle();
      if (clubErr) throw clubErr;
      if (!club) return json(404, { error: `Club not found for slug "${clubSlug}"` });

      // Upsert the meeting.
      const now = new Date().toISOString();
      const meetingFields = {
        club_id: club.id,
        source_session_id: sourceSessionId,
        title: title || null,
        meeting_type: meetingType || null,
        host_name: hostName || null,
        scheduled_at: scheduledAt || null,
        general_notes: generalNotes || null,
        updated_at: now,
      };

      const { data: existingMeeting } = await sb2
        .from('meetings')
        .select('id')
        .eq('club_id', club.id)
        .eq('source_session_id', sourceSessionId)
        .maybeSingle();

      let meetingId;
      if (existingMeeting) {
        meetingId = existingMeeting.id;
        const { error } = await sb2.from('meetings').update(meetingFields).eq('id', meetingId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await sb2
          .from('meetings')
          .insert([meetingFields])
          .select('id')
          .single();
        if (error) throw error;
        meetingId = inserted.id;
      }

      // If members is not provided (undefined/null), this is a metadata-only
      // push — leave existing attendance alone. Callers that want to update
      // attendance pass an array (empty array = "no attendees", which reaps
      // all existing rows). The Save Notes flow passes an array; the
      // Create/Edit Meeting flow doesn't.
      if (!Array.isArray(members)) {
        return json(200, { success: true, meetingId, metadataOnly: true });
      }

      // Upsert attendance rows for the supplied members. Members not in the
      // list get their existing row deleted (admin unchecked them).
      const incomingUserIds = new Set();
      for (const m of members || []) {
        if (!m?.email) continue;
        if (!m.attended && !m.participated && !m.memberNote) continue;
        const userId = await findOrCreateSb2UserByEmail(
          sb2,
          String(m.email).toLowerCase().trim(),
          m.fullName
        );
        incomingUserIds.add(userId);

        const row = {
          meeting_id: meetingId,
          user_id: userId,
          attended: !!m.attended,
          participated: !!m.participated,
          member_note: m.memberNote || null,
          updated_at: now,
        };

        const { data: existing } = await sb2
          .from('meeting_attendance')
          .select('id')
          .eq('meeting_id', meetingId)
          .eq('user_id', userId)
          .maybeSingle();
        if (existing) {
          const { error } = await sb2.from('meeting_attendance').update(row).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await sb2.from('meeting_attendance').insert([row]);
          if (error) throw error;
        }
      }

      // Reap unchecked members from prior saves.
      const { data: existingAttendance } = await sb2
        .from('meeting_attendance')
        .select('id, user_id')
        .eq('meeting_id', meetingId);
      const staleIds = (existingAttendance || [])
        .filter(r => !incomingUserIds.has(r.user_id))
        .map(r => r.id);
      if (staleIds.length > 0) {
        const { error: delErr } = await sb2
          .from('meeting_attendance')
          .delete()
          .in('id', staleIds);
        if (delErr) throw delErr;
      }

      return json(200, { success: true, meetingId });
    }

    if (action === 'deleteMeetingFromSb2') {
      // Mirror of handleDelete on the portal. Removes the meeting row for
      // this (club, source_session_id); meeting_attendance cascades via FK.
      // Quiet no-op if the row wasn't there.
      const { sourceSessionId } = body;
      if (!sourceSessionId) return json(400, { error: 'Missing sourceSessionId' });
      if (!clubId) return json(400, { error: 'Missing or invalid clubSlug' });
      const { error } = await sb2
        .from('meetings')
        .delete()
        .eq('club_id', clubId)
        .eq('source_session_id', sourceSessionId);
      if (error) throw error;
      return json(200, { success: true });
    }

    if (action === 'registerDealShare') {
      // Called when a portal admin picks a deal from the SB2 picker and adds
      // it to their club. Writes (target_type='club', target_id=club_id,
      // deal_id=sourceDealId) so ClubManagementCW + cross-club views can see
      // the club picked it up. Idempotent — silently returns existing row.
      const { sourceDealId } = body;
      if (!sourceDealId) return json(400, { error: 'Missing sourceDealId' });
      if (!clubId) return json(400, { error: 'Missing or invalid clubSlug' });

      const { data: existing } = await sb2
        .from('deal_shares')
        .select('id')
        .eq('target_type', 'club')
        .eq('target_id', clubId)
        .eq('deal_id', sourceDealId)
        .maybeSingle();
      if (existing) return json(200, { success: true, id: existing.id, created: false });

      const { data: inserted, error } = await sb2
        .from('deal_shares')
        .insert([{
          deal_id: sourceDealId,
          target_type: 'club',
          target_id: clubId,
          status: 'pending',
          shared_at: new Date().toISOString(),
        }])
        .select('id')
        .single();
      if (error) throw error;
      return json(200, { success: true, id: inserted.id, created: true });
    }

    if (action === 'unregisterDealShare') {
      // Mirror of removeDeal — wipes the SB2 deal_share row for this (club,
      // deal). Quiet no-op if the row wasn't there.
      const { sourceDealId } = body;
      if (!sourceDealId) return json(400, { error: 'Missing sourceDealId' });
      if (!clubId) return json(400, { error: 'Missing or invalid clubSlug' });
      const { error } = await sb2
        .from('deal_shares')
        .delete()
        .eq('target_type', 'club')
        .eq('target_id', clubId)
        .eq('deal_id', sourceDealId);
      if (error) throw error;
      return json(200, { success: true });
    }

    if (action === 'listAllResponsesAndUsers') {
      // Only return responses recorded against THIS club so admins don't see
      // members' decisions from other clubs they're in.
      let respQuery = sb2.from('dr_responses').select('*').not('user_id', 'is', null);
      if (clubId) respQuery = respQuery.eq('club_id', clubId);
      const [respRes, usersRes] = await Promise.all([
        respQuery,
        sb2.from('users').select('id, email, first_name, last_name'),
      ]);

      if (respRes.error) throw respRes.error;
      if (usersRes.error) throw usersRes.error;

      return json(200, {
        responses: respRes.data || [],
        users: usersRes.data || [],
      });
    }

    return json(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('deal-room-admin error:', err);
    return json(500, { error: err.message || 'Internal error' });
  }
};

export const config = {
  path: '/api/deal-room-admin',
};
