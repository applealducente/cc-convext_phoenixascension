// api/usage.js
// Self-contained usage tracking + team management, backed by Vercel KV.
// Reuses your existing ADMIN_PASSWORD env var (already set in Vercel).
//
// Endpoints:
//   GET  /api/usage?action=teams                      -> public: active teams for the sign-in dropdown
//   POST /api/usage  {action:'signin', name,email,team}-> public: record one sign-in
//   GET  /api/usage?action=list&password=...          -> admin: full sign-in log
//   GET  /api/usage?action=allteams&password=...      -> admin: all teams (incl. hidden)
//   POST /api/usage  {action:'saveTeams', password, teams}-> admin: replace the teams list
//   POST /api/usage  {action:'clear', password}       -> admin: wipe the sign-in log

import { kv } from '@vercel/kv';

const LOG_KEY = 'usage:signins';
const TEAMS_KEY = 'usage:teams';
const DEFAULT_TEAMS = [
  { name: 'Team A', active: true },
  { name: 'Team B', active: true },
];

const send = (res, code, data) => res.status(code).json(data);

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    // ---------- public: list active teams (feeds the sign-in dropdown) ----------
    if (req.method === 'GET' && q.action === 'teams') {
      const teams = (await kv.get(TEAMS_KEY)) || DEFAULT_TEAMS;
      return send(res, 200, { teams: teams.filter((t) => t.active !== false) });
    }

    // ---------- public: record a sign-in ----------
    if (req.method === 'POST' && body.action === 'signin') {
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const team = String(body.team || '').trim();
      if (!name || !email) return send(res, 400, { error: 'Name and email are required.' });

      const rec = { name, email, team, ts: Date.now() };
      const log = (await kv.get(LOG_KEY)) || [];
      log.unshift(rec);
      if (log.length > 5000) log.length = 5000; // keep storage bounded
      await kv.set(LOG_KEY, log);
      return send(res, 200, { saved: true });
    }

    // ---------- everything past here needs the admin password ----------
    const password = body.password || q.password;
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return send(res, 401, { error: 'Unauthorized' });
    }

    if (req.method === 'GET' && q.action === 'list') {
      return send(res, 200, { signins: (await kv.get(LOG_KEY)) || [] });
    }

    if (req.method === 'GET' && q.action === 'allteams') {
      return send(res, 200, { teams: (await kv.get(TEAMS_KEY)) || DEFAULT_TEAMS });
    }

    if (req.method === 'POST' && body.action === 'saveTeams') {
      const teams = Array.isArray(body.teams) ? body.teams : [];
      await kv.set(TEAMS_KEY, teams);
      return send(res, 200, { saved: true, teams });
    }

    if (req.method === 'POST' && body.action === 'clear') {
      await kv.set(LOG_KEY, []);
      return send(res, 200, { cleared: true });
    }

    return send(res, 400, { error: 'Unknown action' });
  } catch (e) {
    return send(res, 500, { error: 'Server error: ' + (e && e.message ? e.message : e) });
  }
}
