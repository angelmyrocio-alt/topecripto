// Panel privado de claves de acceso. Abrir con: /api/keys?key=TU_STATS_KEY
// Generar una clave nueva: el botón de la página (envía un POST; abrir un enlace ya no crea claves)
import crypto from "crypto";

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

function newCode() {
  const h = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `TC-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const secret = process.env.STATS_KEY;
  const q = req.query || {};
  if (!secret || q.key !== secret) { res.status(401).send("No autorizado"); return; }

  const host = req.headers.host || "topecripto.com";
  const base = `https://${host}`;
  let justCreated = null;

  try {
    if (req.method === "POST") {
      const code = newCode();
      const days = Math.max(1, parseInt(q.days || "7", 10) || 7);
      const note = String(q.note || "").slice(0, 60);
      const tier = q.tier === "semana" ? "semana" : "mes";
      await redis(["SET", `code:${code}`, JSON.stringify({ created: Date.now(), activatedAt: null, days, note, tier })]);
      await redis(["RPUSH", "codes:list", code]);
      justCreated = code;
    }

    const list = (await redis(["LRANGE", "codes:list", "0", "-1"])) || [];
    const rows = [];
    for (const code of list) {
      const raw = await redis(["GET", `code:${code}`]);
      if (!raw) continue;
      const o = JSON.parse(raw);
      let estado, dias = "";
      if (o.revoked) estado = "anulada";
      else if (!o.activatedAt) estado = "sin usar";
      else {
        const until = o.activatedAt + (o.days || 7) * 86400000;
        const left = Math.ceil((until - Date.now()) / 86400000);
        if (left > 0) { estado = "activa"; dias = left > 3650 ? "de por vida" : `${left} días`; }
        else estado = "caducada";
      }
      rows.push({ code, estado, dias, note: (o.tier === "semana" ? "Plan Semana" : "Plan Mes") + (o.note ? " · " + o.note : "") });
    }

    const color = (e) => e === "activa" ? "#35c759" : e === "sin usar" ? "#ffd35a" : "#ff5b5b";
    const trs = rows.map((r) => `<tr>
      <td class="mono">${r.code}</td>
      <td><span class="tag" style="background:${color(r.estado)}">${r.estado}</span> ${r.dias}</td>
      <td class="note">${r.note ? r.note : "—"}</td>
      <td><a class="lnk" href="${base}/?acceso=${r.code}" target="_blank">enlace</a></td>
    </tr>`).join("");

    const created = justCreated ? `<div class="created">Clave nueva creada: <b class="mono">${justCreated}</b><br>Enlace para enviar: <a class="lnk" href="${base}/?acceso=${justCreated}">${base}/?acceso=${justCreated}</a></div>` : "";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Topecripto · Claves</title>
<style>
:root{color-scheme:dark}
body{margin:0;background:#05070a;color:#e9f0f7;font-family:system-ui,sans-serif;display:flex;justify-content:center;padding:22px 12px}
.card{width:100%;max-width:640px}
h1{font-size:18px;margin:0 0 2px}
.sub{font-size:12px;color:#7b8696;margin:0 0 14px}
.btn{display:inline-block;border:0;cursor:pointer;font-family:inherit;background:linear-gradient(180deg,#ffd35a,#e0a92e);color:#0b0e13;font-weight:700;text-decoration:none;padding:10px 16px;border-radius:10px;font-size:14px}
.btns{display:flex;flex-wrap:wrap;gap:8px}
.btn.ghost{background:#1c232d;color:#e9f0f7}
.created{margin:14px 0;padding:12px;border:1px solid #4a3d15;border-radius:10px;background:#0b0f15;font-size:13px;line-height:1.6}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
th,td{text-align:left;padding:9px 6px;border-bottom:1px solid #141a22}
th{color:#7b8696;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
.mono{font-family:ui-monospace,monospace}
.tag{color:#0b0e13;font-weight:700;font-size:10px;padding:2px 7px;border-radius:5px}
.note{color:#8891a8}
.lnk{color:#5ab0ff}
.empty{color:#5b6675;font-size:13px;margin-top:16px}
</style></head><body><div class="card">
<h1>Topecripto · Claves de acceso</h1>
<p class="sub">Plan Semana: indicador a 1 semana durante 7 días. Plan Mes: indicador a 1 semana y 1 mes durante 30 días. Los días cuentan desde el primer uso y la clave solo funciona en el primer móvil u ordenador donde se usa.</p>
<div class="btns">
<form method="post" action="/api/keys?key=${encodeURIComponent(secret)}&days=7&tier=semana"><button class="btn" type="submit">+ Plan Semana · 9,99 € (7 días)</button></form>
<form method="post" action="/api/keys?key=${encodeURIComponent(secret)}&days=30&tier=mes"><button class="btn" type="submit">+ Plan Mes · 34,99 € (30 días)</button></form>
<form method="post" action="/api/keys?key=${encodeURIComponent(secret)}&days=36500&tier=mes"><button class="btn ghost" type="submit">+ Plan Mes de por vida (regalo)</button></form>
</div>
${created}
${rows.length ? `<table><thead><tr><th>Clave</th><th>Estado</th><th>Plan</th><th>Enviar</th></tr></thead><tbody>${trs}</tbody></table>` : `<div class="empty">Aún no hay claves. Pulsa "Generar clave nueva".</div>`}
</div></body></html>`);
  } catch (e) {
    res.status(200).send("Error: " + (e && e.message ? e.message : "desconocido"));
  }
}
