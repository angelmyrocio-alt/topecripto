// Valida una clave de acceso en el servidor y cuenta sus días desde el primer uso.
// Cada clave queda atada al primer móvil u ordenador que la usa: en otro dispositivo no sirve.
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
    const dev = String((req.query && req.query.d) || "").slice(0, 64);
    const raw = await redis(["GET", `code:${code}`]);
    if (!raw) { res.status(200).json({ ok: false, reason: "invalida" }); return; }
    const obj = JSON.parse(raw);
    if (obj.product === "tope") { res.status(200).json({ ok: false, reason: "es-del-indicador" }); return; }
    if (obj.revoked) { res.status(200).json({ ok: false, reason: "anulada" }); return; }
    if (obj.device && dev !== obj.device) { res.status(200).json({ ok: false, reason: "otro-dispositivo" }); return; }
    if (!obj.activatedAt || !obj.device) {
      if (!dev) { res.status(200).json({ ok: false, reason: "sin-dispositivo" }); return; }
      obj.activatedAt = obj.activatedAt || Date.now();
      obj.device = dev;
      await redis(["SET", `code:${code}`, JSON.stringify(obj)]);
    }
    const until = obj.activatedAt + (obj.days || 7) * 86400000;
    if (Date.now() > until) { res.status(200).json({ ok: false, reason: "caducada", until }); return; }
    res.status(200).json({ ok: true, until });
  } catch {
    res.status(200).json({ ok: false, reason: "error" });
  }
}
