// Cuenta clics de forma anónima (sin datos personales, sin cookies).
// Guarda un contador por evento en Upstash (base de datos gratis conectada a Vercel).
const ALLOWED = new Set([
  "open_pro", "follow_tiktok", "follow_instagram", "zeros_play", "share",
]);

function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}

export default async function handler(req, res) {
  try {
    const name = String((req.query && req.query.e) || "");
    if (!ALLOWED.has(name)) { res.status(400).json({ ok: false }); return; }
    const { url, token } = creds();
    if (!url || !token) { res.status(200).json({ ok: false, error: "sin-almacen" }); return; }
    await fetch(`${url}/incr/tc:${name}`, { headers: { Authorization: `Bearer ${token}` } });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: false });
  }
}
