// Indicador Tope (servidor). El cálculo vive aquí: el navegador solo recibe el resultado.
// Con el historial real de la moneda mide cuánto subió y bajó el precio, como máximo,
// en cada plazo (1 día, 1 semana, 1 mes) y da los topes, los suelos y la probabilidad
// de llegar a un precio objetivo. No es asesoramiento financiero.

const IDS = {
  BTC: "bitcoin", ETH: "ethereum", XRP: "ripple", SOL: "solana", DOGE: "dogecoin",
  ADA: "cardano", SHIB: "shiba-inu", PEPE: "pepe", HYPE: "hyperliquid", LINK: "chainlink",
  XLM: "stellar", HBAR: "hedera-hashgraph", ORO: "pax-gold",
};

// plazo → [datos, velas del plazo]  (h = precios por hora de 90 días, d = diarios de 365 días)
const PLAZOS = [
  { k: "1d", label: "1 día", src: "h", n: 24 },
  { k: "1w", label: "1 semana", src: "h", n: 168 },
  { k: "1m", label: "1 mes", src: "d", n: 30 },
];
const P_MID = 0.5, P_EXT = 0.9;

function pct(sorted, p) {
  if (!sorted.length) return null;
  const x = (sorted.length - 1) * p, i = Math.floor(x), f = x - i;
  return i + 1 < sorted.length ? sorted[i] + (sorted[i + 1] - sorted[i]) * f : sorted[i];
}

// Para cada momento del pasado: cuánto llegó a subir y a bajar en las n velas siguientes
function excursions(px, n) {
  const ups = [], dns = [];
  for (let i = 0; i + n < px.length; i++) {
    const b = px[i];
    if (!(b > 0)) continue;
    let hi = -Infinity, lo = Infinity;
    for (let j = i + 1; j <= i + n; j++) { if (px[j] > hi) hi = px[j]; if (px[j] < lo) lo = px[j]; }
    ups.push(Math.max(0, hi / b - 1));
    dns.push(Math.max(0, 1 - lo / b));
  }
  ups.sort((a, b) => a - b); dns.sort((a, b) => a - b);
  return { ups, dns };
}

function verdict(p) {
  return p >= 50 ? "PROBABLE" : p >= 20 ? "POSIBLE" : p >= 5 ? "DIFÍCIL" : "IMPROBABLE";
}

const cache = new Map(); // en caliente, entre llamadas de la misma instancia

async function series(id, days) {
  const key = id + ":" + days, hit = cache.get(key);
  if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit.v;
  const headers = { accept: "application/json" };
  if (process.env.COINGECKO_API_KEY) headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
  const r = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`, { headers });
  if (!r.ok) throw new Error("coingecko " + r.status);
  const j = await r.json();
  const v = (j.prices || []).map((p) => p[1]).filter((x) => x > 0);
  cache.set(key, { t: Date.now(), v });
  return v;
}

export default async function handler(req, res) {
  try {
    const sym = String((req.query && req.query.c) || "BTC").toUpperCase();
    const id = IDS[sym];
    if (!id) { res.status(400).json({ error: "Moneda no disponible" }); return; }
    const target = parseFloat(String((req.query && req.query.t) || "0").replace(",", "."));

    const [h, d] = await Promise.all([series(id, 90), series(id, 365)]);
    if (h.length < 500 || d.length < 100) throw new Error("pocos datos");
    const price = h[h.length - 1];

    const plazos = PLAZOS.map((pl) => {
      const px = pl.src === "h" ? h : d;
      const { ups, dns } = excursions(px, pl.n);
      const out = {
        k: pl.k, label: pl.label, casos: ups.length,
        topeExt: price * (1 + pct(ups, P_EXT)), topeMid: price * (1 + pct(ups, P_MID)),
        sueloMid: price * (1 - pct(dns, P_MID)), sueloExt: price * (1 - pct(dns, P_EXT)),
      };
      if (target > 0) {
        const up = target >= price, need = up ? target / price - 1 : 1 - target / price;
        const arr = up ? ups : dns;
        const hits = arr.filter((v) => v >= need).length;
        out.prob = arr.length ? (100 * hits) / arr.length : null;
        out.veredicto = out.prob == null ? null : verdict(out.prob);
      }
      return out;
    });

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
    res.status(200).json({ sym, price, target: target > 0 ? target : null, plazos, updated: Date.now() });
  } catch (e) {
    res.status(502).json({ error: "No se pudo calcular ahora. Prueba en un minuto." });
  }
}
