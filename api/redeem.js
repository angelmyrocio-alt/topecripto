// Valida una clave de acceso en el servidor y cuenta 30 días desde el primer uso.
// La caducidad vive en Upstash: no se puede resetear desde el navegador.
async function redis(cmd) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const d = await r.json();
  return d && "result" in d ? d.result : null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const code = String((req.query && req.query.code) || "").trim();
    if (!code) { res.status(200).json({ ok: false, reason: "sin-codigo" }); return; }
    const raw = await redis(["GET", `code:${code}`]);
    if (!raw) { res.status(200).json({ ok: false, reason: "invalida" }); return; }
    const obj = JSON.parse(raw);
    if (obj.revoked) { res.status(200).json({ ok: false, reason: "anulada" }); return; }
    if (!obj.activatedAt) {
      obj.activatedAt = Date.now();
      await redis(["SET", `code:${code}`, JSON.stringify(obj)]);
    }
    const until = obj.activatedAt + (obj.days || 30) * 86400000;
    if (Date.now() > until) { res.status(200).json({ ok: false, reason: "caducada", until }); return; }
    res.status(200).json({ ok: true, until });
  } catch {
    res.status(200).json({ ok: false, reason: "error" });
  }
}
