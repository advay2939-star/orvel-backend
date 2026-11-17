/* GET /api/public-config
   Only browser-safe values. The anon key is public by design — RLS is
   what protects the data. Keeps keys out of the repo. */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json({
    supabaseUrl:     process.env.SUPABASE_URL      || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
  });
}
