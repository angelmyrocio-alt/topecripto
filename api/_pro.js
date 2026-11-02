// Comprueba en el servidor si una clave Pro es válida para este dispositivo (no se puede falsear desde el navegador).
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

// Devuelve el plan de la clave ("semana" o "mes") o null si no vale para este dispositivo.
export async function proTier(code, dev) {
  try {
    if (!code || !dev) return null;
    const raw = await redis(["GET", `code:${String(code).trim()}`]);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o.revoked || !o.activatedAt || o.device !== dev) return null;
    if (Date.now() > o.activatedAt + (o.days || 7) * 86400000) return null;
    return o.tier === "semana" ? "semana" : "mes";
  } catch { return null; }
}
