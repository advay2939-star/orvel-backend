/* GET /api/keepalive - Vercel cron, once a day.
   Free Supabase projects pause after 7 days without activity; a paused
   project silently breaks brief saving. This touches the database daily. */
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ ok: false, error: 'not_configured' });
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  try {
    const r = await fetch(`${url}/rest/v1/rpc/orvel_keepalive`, { method: 'POST', headers, body: '{}' });
    if (!r.ok) console.error('keepalive: supabase', r.status, await r.text());
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status });
  } catch (err) {
    console.error('keepalive: exception', err);
    return res.status(502).json({ ok: false });
  }
}
