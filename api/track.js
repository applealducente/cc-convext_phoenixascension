// api/track.js
// Records agent sign-ins and serves the usage report for the dashboard.
// Uses the same Upstash KV helper and ADMIN_PASSWORD pattern as the
// other endpoints in this project.
//
//   POST { action:'log', name, email }            -> records a sign-in (no password)
//   POST { action:'report', password }            -> returns usage data (admin only)
//   POST { action:'reset',  password }            -> clears all usage data (admin only)

const { kvGet, kvSet, kvDel, isConfigured } = require('./_kv');

const USAGE_KEY = 'phoenix-usage-v1';
const MAX_EVENTS = 500;          // keep the most recent N sign-ins
const TZ = 'America/Chicago';    // US Central — handles CST/CDT automatically

// Returns the calendar date (YYYY-MM-DD) for a timestamp, in US Central time.
function dayStr(ts) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(ts));
  } catch (e) {
    return new Date(ts).toISOString().slice(0, 10);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const action = body.action;

  if (!isConfigured()) {
    return res.status(500).json({ error: 'Storage is not connected to this project yet.' });
  }

  // ---------- TLs: view report (separate dashboard password) ----------
  if (action === 'report') {
    const dashPassword = process.env.DASHBOARD_PASSWORD;
    if (!dashPassword) {
      return res.status(500).json({ error: 'Dashboard password not set. Add a DASHBOARD_PASSWORD environment variable in Vercel, then redeploy.' });
    }
    if (!body.password || body.password !== dashPassword) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    let data;
    try { data = await kvGet(USAGE_KEY); } catch (e) { data = null; }
    return res.status(200).json(data || { users: {}, events: [] });
  }

  // ---------- admin only: wipe all usage data ----------
  if (action === 'reset') {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return res.status(500).json({ error: 'Admin password not configured on server.' });
    }
    if (!body.password || body.password !== adminPassword) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    try { await kvDel(USAGE_KEY); } catch (e) { /* ignore */ }
    return res.status(200).json({ ok: true });
  }

  // ---------- agent: log a sign-in ----------
  if (action === 'log') {
    const name = (body.name || '').toString().trim().slice(0, 80);
    const email = (body.email || '').toString().trim().toLowerCase().slice(0, 120);
    const team = (body.team || '').toString().trim().slice(0, 80);

    if (!name || !email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
      return res.status(400).json({ error: 'Name and a valid email are required.' });
    }

    const ts = Date.now();
    const day = dayStr(ts);

    let data;
    try { data = await kvGet(USAGE_KEY); } catch (e) { data = null; }
    if (!data || typeof data !== 'object') data = { users: {}, events: [] };
    if (!data.users) data.users = {};
    if (!Array.isArray(data.events)) data.events = [];

    let u = data.users[email];
    if (!u) {
      u = { name: name, email: email, team: team, firstSeen: ts, lastSeen: ts, sessions: 0, days: {} };
      data.users[email] = u;
    }
    u.name = name;                 // keep the latest spelling of their name
    if (team) u.team = team;       // keep their most recent team
    u.lastSeen = ts;
    u.sessions = (u.sessions || 0) + 1;
    u.days = u.days || {};
    u.days[day] = (u.days[day] || 0) + 1;

    data.events.unshift({ name: name, email: email, team: team, ts: ts, day: day });
    if (data.events.length > MAX_EVENTS) data.events.length = MAX_EVENTS;

    try {
      await kvSet(USAGE_KEY, data);
    } catch (e) {
      console.error('KV write error (track):', e);
      return res.status(500).json({ error: 'Failed to record sign-in.' });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action.' });
};
