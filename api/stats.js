// Página privada de estadísticas. Ábrela con: /api/stats?key=TU_CLAVE
// La clave se guarda en la variable de entorno STATS_KEY (en Vercel).
const EVENTS = [
  ["open_pro", "Visitas a la pestaña Pro"],
  ["follow_tiktok", "Clics en seguir TikTok"],
  ["follow_instagram", "Clics en seguir Instagram"],
  ["zeros_play", "Partidas al juego de los ceros"],
  ["share", "Veredictos compartidos"],
  // Versión anterior (se conservan para ver el histórico)
  ["founder_reserve", "Antes: reservas Fundador"],
  ["interest_pro", "Antes: interesados en Pro"],
  ["interest_over", "Antes: interesados en Overdrive"],
];

function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}

export default async function handler(req, res) {
  const secret = process.env.STATS_KEY;
  if (!secret || !req.query || req.query.key !== secret) {
    res.status(401).send("No autorizado");
    return;
  }
  const { url, token } = creds();
  const counts = {};
  try {
    if (url && token) {
      const keys = EVENTS.map(([k]) => `tc:${k}`);
      const r = await fetch(`${url}/mget/${keys.join("/")}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      const arr = (data && data.result) || [];
      EVENTS.forEach(([k], i) => { counts[k] = parseInt(arr[i] || "0", 10) || 0; });
    }
  } catch { /* muestra 0 */ }

  const rows = EVENTS.map(([k, label]) =>
    `<tr><td>${label}</td><td class="n">${counts[k] || 0}</td></tr>`).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Topecripto · Stats</title>
<style>
:root{color-scheme:dark}
body{margin:0;background:#05070a;color:#e9f0f7;font-family:system-ui,sans-serif;display:flex;justify-content:center;padding:24px 14px}
.card{width:100%;max-width:420px;background:#0b0f15;border:1px solid #1c232d;border-radius:16px;padding:20px}
h1{font-size:18px;margin:0 0 2px}
.sub{font-size:12px;color:#7b8696;margin:0 0 16px}
table{width:100%;border-collapse:collapse}
td{padding:11px 4px;border-bottom:1px solid #141a22;font-size:14px}
td.n{text-align:right;font-weight:700;font-size:20px;color:#ffd35a}
.foot{margin-top:14px;font-size:11px;color:#5b6675}
</style></head><body><div class="card">
<h1>Topecripto · Contador de clics</h1>
<p class="sub">Solo tu ves esto. Datos anonimos, sin cookies.</p>
<table>${rows}</table>
<div class="foot">Actualizado: ${new Date().toLocaleString("es-ES")}</div>
</div></body></html>`);
}
