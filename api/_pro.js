// Códigos del indicador Tope (producto aparte de Topecripto Pro), comprobados en el servidor.
// Cada código queda atado al primer móvil u ordenador que lo usa y dura sus días desde ese primer uso.
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

export async function topeAccess(code, dev) {
  try {
    code = String(code || "").trim();
    dev = String(dev || "").slice(0, 64);
    if (!code) return { ok: false, reason: "sin-codigo" };
    if (!dev) return { ok: false, reason: "sin-dispositivo" };
    const raw = await redis(["GET", `code:${code}`]);
    if (!raw) return { ok: false, reason: "invalida" };
    const o = JSON.parse(raw);
    if (o.product !== "tope" || o.revoked) return { ok: false, reason: "invalida" };
    if (o.device && o.device !== dev) return { ok: false, reason: "otro-dispositivo" };
    if (!o.activatedAt) {
      o.activatedAt = Date.now();
      o.device = dev;
      await redis(["SET", `code:${code}`, JSON.stringify(o)]);
    }
    const until = o.activatedAt + (o.days || 7) * 86400000;
    if (Date.now() > until) return { ok: false, reason: "caducada" };
    return { ok: true, until };
  } catch { return { ok: false, reason: "error" }; }
}
