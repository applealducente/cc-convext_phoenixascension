// api/content.js
// GET: returns the current content (from KV if available, otherwise the bundled default)
// POST: saves new content to KV (requires password)

const { kvGet, kvSet, isConfigured } = require('./_kv');
const defaultContent = require('../public/content.json');

const CONTENT_KEY = 'phoenix-content-v1';

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    if (isConfigured()) {
      try {
        const stored = await kvGet(CONTENT_KEY);
        if (stored) {
          return res.status(200).json(stored);
        }
      } catch (err) {
        console.error('KV read error:', err);
      }
    }
    return res.status(200).json(defaultContent);
  }

  if (req.method === 'POST') {
    const { password, content } = req.body || {};

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return res.status(500).json({ error: 'Admin password not configured on server.' });
    }

    if (!password || password !== adminPassword) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    if (!content || typeof content !== 'object') {
      return res.status(400).json({ error: 'Invalid content payload.' });
    }

    if (!isConfigured()) {
      return res.status(500).json({ error: 'Storage is not connected to this project yet.' });
    }

    try {
      await kvSet(CONTENT_KEY, content);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('KV write error:', err);
      return res.status(500).json({ error: 'Failed to save content. Make sure storage is connected to this project.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
