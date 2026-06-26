import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This portal does not use the Supabase auth session for app state — identity
// comes from the member_sessions table and data reads use the anon key. The
// auth session is only used transiently at login (signInWithPassword) and the
// password-change updateUser call, both within a single page load.
//
// Persisting it (the default) left a stale, expired session in localStorage
// whose background autoRefreshToken contended the supabase-js auth Web Lock
// with signInWithPassword — intermittently hanging login until a hard refresh.
// Disabling persistence / auto-refresh / URL detection removes that contention
// while leaving the in-memory session available for the immediate updateUser.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

// Maps this portal to its row in SB2 public.clubs. Used to scope dr_responses
// (and meeting mirrors) by club so a member's decision in one club doesn't
// bleed into another club they're also in.
export const SB2_CLUB_SLUG = 'maritime'

export const getDeviceId = () => {
  let deviceId = localStorage.getItem('ngvc_device_id')
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
    localStorage.setItem('ngvc_device_id', deviceId)
  }
  return deviceId
}

const callDealRoom = async (path, action, args = {}) => {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // clubSlug auto-attaches so dr_responses + meeting writes are club-scoped
    // without each call site needing to remember to pass it.
    body: JSON.stringify({ device_id: getDeviceId(), action, clubSlug: SB2_CLUB_SLUG, ...args }),
  })
  const text = await res.text()
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      `${path} (action: ${action}) did not return JSON — got ${res.status} ${contentType || 'no content-type'}. ` +
      `This usually means the Netlify function isn't running (e.g., you're on \`npm run dev\` instead of \`netlify dev\`).`
    )
  }
  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data.error || `${path} (action: ${action}) failed (${res.status})`)
  return data
}

export const callDealRoomMember = (action, args = {}) =>
  callDealRoom('/api/deal-room-member', action, args)

export const callDealRoomAdmin = (action, args = {}) =>
  callDealRoom('/api/deal-room-admin', action, args)

// Authenticated fetch — attaches the member's device id so the server can
// look up the session and identify the viewer (used by /api/doc-view).
export const authFetch = (input, init = {}) => {
  const headers = new Headers(init.headers || {})
  headers.set('X-Device-Id', getDeviceId())
  return fetch(input, { ...init, headers })
}
