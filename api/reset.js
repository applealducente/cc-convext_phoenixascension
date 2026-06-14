// api/reset.js
// POST: clears the KV-stored content, reverting the live site to the
// bundled content.json (the version deployed from the repo).

import { kv } from '@vercel/kv';

const CONTENT_KEY = 'phoenix-content-v1';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'Admin password not configured on server.' });
  }

  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  try {
    await kv.del(CONTENT_KEY);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('KV delete error:', err);
    return res.status(500).json({ error: 'Failed to reset content.' });
  }
}
