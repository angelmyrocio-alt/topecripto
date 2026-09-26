import React, { useState, useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

// ===== Datos de reserva (CoinGecko, 26/09/2026). Se sustituyen por los datos en vivo de /api/prices =====
const FALLBACK_TOTAL = 2.974e12;
const BASE = [
  { sym: "BTC",  name: "Bitcoin",     price: 83838,       supply: 20.08e6,    absurd: 1000000 },
  { sym: "ETH",  name: "Ethereum",    price: 2685.87,     supply: 122.07e6,   absurd: 50000 },
  { sym: "XRP",  name: "XRP",         price: 1.55,        supply: 62.879e9,   absurd: 100 },
  { sym: "SOL",  name: "Solana",      price: 120.56,      supply: 587.713e6,  absurd: 1000 },
  { sym: "DOGE", name: "Dogecoin",    price: 0.09735,     supply: 156.07e9,   absurd: 10 },
  { sym: "ADA",  name: "Cardano",     price: 0.2564,      supply: 37.529e9,   absurd: 100 },
  { sym: "SHIB", name: "Shiba Inu",   price: 0.000005842, supply: 589.239e12, absurd: 1 },
  { sym: "PEPE", name: "Pepe",        price: 0.00000444,  supply: 420.69e12,  absurd: 0.01 },
];
const MEMES = ["SHIB", "PEPE", "DOGE"];

// ===== Redes (el anuncio de Pro se hace ahí; no guardamos datos personales) =====
const TIKTOK = "https://www.tiktok.com/@topecripto.app";
const INSTAGRAM = "https://www.instagram.com/topecripto/";

// ===== Formato (español) =====
const esNum = (x, d) => x.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtCap = (v) => {
  if (v >= 1e12) { const x = v / 1e12; return esNum(x, x >= 100 ? 0 : x >= 10 ? 1 : 2) + (x < 1.005 ? " billón" : " billones"); }
  if (v >= 1e9) { const x = v / 1e9; return esNum(x, x >= 100 ? 0 : 1) + " mil M"; }
  return esNum(v / 1e6, 0) + " M";
};
const fmtPrice = (p) => {
  if (p >= 1000) return esNum(p, 0) + " $";
  if (p >= 1) return esNum(p, 2) + " $";
  const dec = Math.max(2, -Math.floor(Math.log10(p)) + 2);
  return p.toFixed(dec).replace(".", ",") + " $";
};
const fmtInput = (p) => {
  if (p >= 1) return p >= 1000 ? esNum(p, 0) : String(+p.toFixed(2)).replace(".", ",");
  const dec = Math.max(2, -Math.floor(Math.log10(p)) + 1);
  return p.toFixed(dec).replace(/0+$/, "").replace(".", ",");
};
const parseEs = (t) => {
  t = String(t).replace(/\s|\$/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  const v = parseFloat(t);
  return isFinite(v) && v > 0 ? v : null;
};
const pctTxt = (pct) => pct >= 100 ? esNum(pct / 100, pct >= 1000 ? 0 : 1) + "×" : esNum(pct, pct < 1 ? 2 : 0) + " %";

// ===== Veredicto: qué parte de TODO el mercado cripto haría falta (mismo criterio que los vídeos) =====
function zone(cap, total) {
  const r = cap / total;
  if (r >= 1) return { c: "#ff2d2d", t: "IMPOSIBLE", m: "Valdría más que todo el cripto del mundo junto." };
  if (r >= 0.5) return { c: "#ff7a1a", t: "MUY IMPROBABLE", m: "Se comería más de la mitad de todo el mercado cripto." };
  if (r >= 0.25) return { c: "#ffb02e", t: "AGRESIVO", m: "Exigiría un ciclo alcista histórico." };
  return { c: "#35c759", t: "POSIBLE", m: "Cabe en el mercado actual, aunque exija subir mucho." };
}

// ===== Medidor: escala logarítmica de 10 mil M a 10 billones =====
const CX = 200, CY = 200, R = 150, SW = 125;
const toT = (m) => { const lo = Math.log10(1e10), hi = Math.log10(1e13); return Math.max(0, Math.min(1, (Math.log10(Math.max(m, 1)) - lo) / (hi - lo))); };
const ang = (t) => -SW + t * 2 * SW;
const pol = (a) => { const r = (a * Math.PI) / 180; return [CX + R * Math.sin(r), CY - R * Math.cos(r)]; };
const arcP = (a0, a1) => { const [s1, s2] = pol(a0), [e1, e2] = pol(a1); return `M${s1} ${s2}A${R} ${R} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${e1} ${e2}`; };

// Cuenta clics de forma anónima (sin datos personales). Lo ves en /api/stats.
function trackInterest(name) {
  try {
    track(name);
    fetch("/api/track?e=" + encodeURIComponent(name)).catch(() => {});
  } catch { /* sin ruido */ }
}

export default function App() {
  const [coins, setCoins] = useState(BASE);
  const [total, setTotal] = useState(FALLBACK_TOTAL);
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState("diag");
  const [unlocked, setUnlocked] = useState(false);

  // Precios en vivo (la clave de CoinGecko vive en el servidor)
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/prices");
        if (!r.ok) return;
        const d = await r.json();
        if (!alive || !d.coins || !d.coins.length) return;
        if (d.totalCrypto > 0) setTotal(d.totalCrypto);
        setCoins(d.coins);
        setLive(true);
      } catch { /* se queda con los datos de reserva */ }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Acceso completo con clave validada en el servidor: ?acceso=CODIGO
  useEffect(() => {
    let alive = true, code = null;
    try { code = new URLSearchParams(window.location.search).get("acceso") || localStorage.getItem("tc_code"); } catch {}
    if (!code) return;
    fetch("/api/redeem?code=" + encodeURIComponent(code))
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d && d.ok) { setUnlocked(true); try { localStorage.setItem("tc_code", code); } catch {} }
        else { try { localStorage.removeItem("tc_code"); } catch {} }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const goPro = () => { setTab("pro"); trackInterest("open_pro"); };

  return (
    <div className="tc-root">
      <style>{css}</style>
      <main className="phone">
        <div className="top">
          <div>
            <div className="brand">TOPE<b>CRIPTO</b></div>
            <div className="live"><i style={{ background: live ? "#35c759" : "#ffb02e", boxShadow: `0 0 6px ${live ? "#35c759" : "#ffb02e"}` }} />{live ? "EN VIVO" : "cargando…"}</div>
          </div>
          <button className={"chip" + (unlocked ? " chipFull" : "")} type="button" onClick={goPro}>{unlocked ? "PRO ✓" : "PRO · 3 €/mes"}</button>
        </div>

        {tab === "diag" && (
          <div>
            <h1>¿Ese precio que te prometen es posible?</h1>
            <p className="lead">Elige la moneda, escribe el precio que has oído y mira cuánto dinero haría falta de verdad.</p>
          </div>
        )}

        <div className="nav" role="tablist">
          {[["diag", "Diagnóstico"], ["zeros", "Ceros"], ["hist", "Promesas"], ["pro", "PRO"]].map(([k, l]) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => (k === "pro" ? goPro() : setTab(k))}>
              {k === "pro" ? <span className="pill">PRO</span> : l}
            </button>
          ))}
        </div>

        {tab === "diag" && <Diag coins={coins} total={total} />}
        {tab === "zeros" && <Zeros coins={coins} total={total} />}
        {tab === "hist" && <Promises coins={coins} total={total} onPro={goPro} />}
        {tab === "pro" && <Pro coins={coins} total={total} unlocked={unlocked} onBack={() => setTab("diag")} />}

        <div className="foot"><span>{live ? "Datos en vivo · CoinGecko" : "Cargando datos en vivo…"}</span><span>No es asesoramiento financiero</span></div>
      </main>
    </div>
  );
}

// ===== DIAGNÓSTICO (gratis) =====
function initialCoin(coins) {
  try {
    const h = (window.location.hash || "").slice(1).toUpperCase();
    const i = coins.findIndex((c) => c.sym === h);
    if (i >= 0) return i;
  } catch {}
  const x = coins.findIndex((c) => c.sym === "XRP");
  return x >= 0 ? x : 0;
}

function Diag({ coins, total }) {
  const [ci, setCi] = useState(() => initialCoin(coins));
  const coin = coins[ci] || coins[0];
  const [price, setPrice] = useState(() => (coins[initialCoin(coins)] || coins[0]).absurd);
  const [text, setText] = useState(() => fmtInput((coins[initialCoin(coins)] || coins[0]).absurd));
  const [copied, setCopied] = useState(false);

  const pick = (i) => { setCi(i); const p = coins[i].absurd; setPrice(p); setText(fmtInput(p)); };
  const range = [coin.price * 0.5, coin.price * Math.max(300, (coin.absurd / coin.price) * 3)];
  const sVal = Math.round((Math.log(price / range[0]) / Math.log(range[1] / range[0])) * 1000);

  const cap = price * coin.supply, z = zone(cap, total), mult = price / coin.price, pct = (cap / total) * 100;
  const compare = pct >= 100
    ? `${coin.sym} a ${fmtPrice(price)} = ${fmtCap(cap)} · ${esNum(pct / 100, pct >= 1000 ? 0 : 1)} veces todo el cripto (${fmtCap(total)})`
    : `${coin.sym} a ${fmtPrice(price)} = ${fmtCap(cap)} · todo el cripto hoy: ${fmtCap(total)}`;

  const cuts = [0, toT(total * 0.25), toT(total * 0.5), toT(total), 1];
  const cols = ["#35c759", "#ffb02e", "#ff7a1a", "#ff2d2d"];

  const share = async () => {
    const txt = `${coin.sym} a ${fmtPrice(price)} → ${z.t}. Harían falta ${fmtCap(cap)} de capitalización. Compruébalo en Topecripto:`;
    const url = "https://topecripto.com/#" + coin.sym.toLowerCase();
    try {
      if (navigator.share) await navigator.share({ title: "Topecripto", text: txt, url });
      else { await navigator.clipboard.writeText(txt + " " + url); setCopied(true); setTimeout(() => setCopied(false), 2500); }
      trackInterest("share");
    } catch { /* cancelado */ }
  };

  return (
    <section className="stack">
      <div className="coins">
        {coins.map((c, i) => (
          <button key={c.sym} type="button" aria-pressed={i === ci} onClick={() => pick(i)}>{c.sym}</button>
        ))}
      </div>
      <div className="ask">
        <label htmlFor="price">Precio que dicen</label>
        <input id="price" inputMode="decimal" autoComplete="off" value={text}
          onChange={(e) => { setText(e.target.value); const v = parseEs(e.target.value); if (v) setPrice(v); }} />
        <span>$</span>
      </div>
      <svg viewBox="0 0 400 270" role="img" aria-label="Medidor de capitalización">
        {cols.map((c, i) => (
          <path key={c} d={arcP(ang(cuts[i]), ang(cuts[i + 1]))} stroke={c} strokeWidth="14" fill="none" strokeLinecap={i === 0 || i === 3 ? "round" : "butt"} />
        ))}
        <text x="360" y="252" textAnchor="end" fill="#ff2d2d" fontSize="11" className="mono">TOPE</text>
        <g style={{ transform: `rotate(${ang(toT(cap))}deg)`, transformOrigin: `${CX}px ${CY}px`, transition: "transform .45s cubic-bezier(.2,.9,.2,1)" }}>
          <line x1={CX} y1={CY} x2={CX} y2={58} stroke={z.c} strokeWidth="4" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${z.c})` }} />
        </g>
        <circle cx={CX} cy={CY} r="12" fill="#0b0e13" stroke="#3a4453" strokeWidth="2" />
        <circle cx={CX} cy={CY} r="4" fill={z.c} />
        <text x={CX} y="142" textAnchor="middle" fill="#5b6675" fontSize="11" className="mono">HOY</text>
        <text x={CX} y="170" textAnchor="middle" fill="#c7d0dc" fontSize="24" className="disp">{fmtPrice(coin.price)}</text>
      </svg>
      <input type="range" className="rng" min="0" max="1000" value={isFinite(sVal) ? sVal : 0} aria-label="Ajustar precio"
        onChange={(e) => { const p = range[0] * Math.pow(range[1] / range[0], e.target.value / 1000); setPrice(p); setText(fmtInput(p)); }} />
      <Reads cap={cap} mult={mult} pct={pct} col={z.c} />
      <Verdict z={z} />
      <p className="compare">{compare}</p>
      <button className="ghost share" type="button" onClick={share}>{copied ? "✓ Copiado" : "↗ Compartir veredicto"}</button>
      <details>
        <summary>¿Cómo se calcula?</summary>
        <ol>
          <li>Precio que dicen × monedas que existen = lo que valdría la moneda entera (su capitalización).</li>
          <li>Esa cifra se compara con todo el cripto del mundo junto: <b>{fmtCap(total)} $</b>.</li>
          <li>Verde si cabe con holgura, rojo si haría falta más dinero del que existe. Solo aritmética.</li>
        </ol>
      </details>
    </section>
  );
}

const Reads = ({ cap, mult, pct, col, multTxt }) => (
  <div className="reads">
    <div className="read"><small>CAPITALIZACIÓN</small><b style={{ color: col }}>{fmtCap(cap)}</b></div>
    <div className="read"><small>× PRECIO HOY</small><b>{multTxt || "×" + (mult >= 100 ? esNum(Math.round(mult), 0) : esNum(mult, 1))}</b></div>
    <div className="read"><small>DEL MERCADO</small><b style={{ color: pct >= 100 ? "#ff2d2d" : "#e9f0f7" }}>{pctTxt(pct)}</b></div>
  </div>
);

const Verdict = ({ z }) => (
  <div className="verdict" style={{ borderColor: z.c + "66" }}>
    <span className="tag" style={{ background: z.c }}>{z.t}</span>
    <p>{z.m}</p>
  </div>
);

// ===== JUEGO DE LOS CEROS (gratis) =====
function Zeros({ coins, total }) {
  const list = coins.filter((c) => MEMES.includes(c.sym));
  const [sym, setSym] = useState(list[0] ? list[0].sym : null);
  const [k, setK] = useState(0);
  const c = list.find((x) => x.sym === sym);
  if (!c) return <p className="lead">Cargando monedas…</p>;
  const p = c.price * Math.pow(10, k), cap = p * c.supply, z = zone(cap, total), pct = (cap / total) * 100;
  let priceEl = fmtPrice(p);
  if (p < 1) {
    const dec = Math.max(2, -Math.floor(Math.log10(c.price)) + 2);
    const m = c.price.toFixed(dec).match(/^0\.(0*)(\d+)$/);
    if (m) {
      const zeros = m[1].length, removed = Math.min(k, zeros);
      priceEl = <>0,<em>{"0".repeat(removed)}</em>{"0".repeat(zeros - removed)}{m[2]} $</>;
    }
  }
  const more = () => { setK(k + 1); if (k === 0) trackInterest("zeros_play"); };
  return (
    <section className="stack">
      <div><h2 className="sec">El juego de los ceros</h2><p className="lead">Quita ceros al precio de una memecoin y mira cuánto dinero haría falta.</p></div>
      <div className="coins">
        {list.map((x) => <button key={x.sym} type="button" aria-pressed={x.sym === sym} onClick={() => { setSym(x.sym); setK(0); }}>{x.sym}</button>)}
      </div>
      <div className="zbox">
        <small>PRECIO</small>
        <div className="zprice">{priceEl}</div>
        <small>{k === 0 ? "precio de hoy" : `${k} ${k === 1 ? "cero quitado" : "ceros quitados"} → ${fmtPrice(p)}`}</small>
      </div>
      <div className="zbtns">
        <button className="ghost" type="button" disabled={k === 0} onClick={() => setK(Math.max(0, k - 1))}>↺ Poner un cero</button>
        <button className="btn" type="button" disabled={p >= 1} onClick={more}>Quitar un cero</button>
      </div>
      <Reads cap={cap} pct={pct} col={z.c} multTxt={"×" + esNum(Math.pow(10, k), 0)} />
      <Verdict z={z} />
    </section>
  );
}

// ===== QUIÉN PROMETIÓ QUÉ (3 casos gratis; el historial completo, en Pro) =====
const CASES = [
  { who: "John McAfee", coin: "BTC", claim: "1.000.000 $ a finales de 2020", st: "FALLIDA", c: "#ff2d2d",
    p: "Lo prometió en 2017. Bitcoin cerró 2020 alrededor de 29.000 $. En enero de 2020 él mismo dijo que la cifra era «una treta».",
    src: "https://www.forbes.com/sites/billybambrough/2020/01/06/one-of-the-biggest-bets-in-bitcoin-revealed-to-be-a-ruse/", sn: "Forbes" },
  { who: "Tim Draper", coin: "BTC", claim: "250.000 $ a finales de 2022", st: "FALLIDA", c: "#ff2d2d",
    p: "Lo dijo en abril de 2018. Bitcoin cerró 2022 alrededor de 16.500 $, tras la caída de FTX.",
    src: "https://www.cnbc.com/2018/04/13/tech-investor-tim-draper-predicts-bitcoin-will-reach-250000-by-2022.html", sn: "CNBC" },
  { who: "Vincent Van Code", coin: "XRP", claim: "500 $ entre 2032 y 2035", st: "EN CURSO", c: "#ffb02e", target: 500,
    src: "https://www.tradingview.com/news/newsbtc:1d7b67119094b:0-pundit-predicts-when-xrp-price-will-hit-500-and-what-will-drive-the-rally/", sn: "NewsBTC" },
];

function Promises({ coins, total, onPro }) {
  return (
    <section className="stack">
      <div><h2 className="sec">Quién prometió qué</h2><p className="lead">Predicciones públicas, con fecha, y lo que pasó de verdad.</p></div>
      {CASES.map((k) => {
        let p = k.p;
        if (k.target) {
          const x = coins.find((c) => c.sym === k.coin);
          if (x) { const cap = k.target * x.supply; p = `Hoy ${k.coin} vale ${fmtPrice(x.price)}. A ${fmtPrice(k.target)} valdría ${fmtCap(cap)}: ${esNum(cap / total, 1)} veces todo el cripto actual.`; }
        }
        return (
          <div className="case" key={k.who}>
            <div className="who"><b>{k.who} · {k.coin}</b><span className="t" style={{ background: k.c }}>{k.st}</span></div>
            <div className="claim">{k.claim}</div>
            <p>{p}</p>
            <a href={k.src} target="_blank" rel="noopener noreferrer">Fuente: {k.sn}</a>
          </div>
        );
      })}
      <div className="locked">
        <div className="preview">
          <div className="row"><b>ETH</b><span className="p">???</span><span className="m">predicción de 2021</span><span className="t" style={{ background: "#ff2d2d" }}>FALLIDA</span></div>
          <div className="row"><b>SOL</b><span className="p">???</span><span className="m">predicción de 2024</span><span className="t" style={{ background: "#ffb02e" }}>EN CURSO</span></div>
        </div>
        <div className="overlay"><strong>Historial completo en Pro</strong><button className="gold" type="button" onClick={onPro}>Ver Topecripto Pro</button></div>
      </div>
    </section>
  );
}

// ===== PRO (plan único) =====
function Pro({ coins, total, unlocked, onBack }) {
  const sample = [["XRP", 100], ["SOL", 1000], ["DOGE", 10], ["SHIB", 1], ["PEPE", 0.01]];
  const rows = sample.map(([s, t]) => {
    const c = coins.find((x) => x.sym === s); if (!c) return null;
    const cap = t * c.supply, z = zone(cap, total);
    return <div className="row" key={s}><b>{s}</b><span className="p">{fmtPrice(t)}</span><span className="m">{fmtCap(cap)}</span><span className="t" style={{ background: z.c }}>{z.t}</span></div>;
  });

  if (unlocked) {
    return (
      <section className="stack">
        <Detector coins={coins} total={total} />
        <button className="ghost" type="button" onClick={onBack}>← Volver al diagnóstico</button>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="plan">
        <div className="head"><span className="name">Topecripto Pro</span><span className="price">3 €<small> /mes</small></span></div>
        <ul>
          <li>Detector de tablas de influencers</li>
          <li>Watchlist con alertas de veredicto</li>
          <li>«Quién prometió qué» completo, con avisos de nuevos casos</li>
          <li>Todas las monedas, no solo las principales</li>
        </ul>
        <div className="stack">
          <p className="flabel">Lo anunciaremos primero en nuestras redes. Síguenos para enterarte:</p>
          <div className="social">
            <a className="gold sbtn" href={TIKTOK} target="_blank" rel="noopener noreferrer" onClick={() => trackInterest("follow_tiktok")}>TikTok · @topecripto.app</a>
            <a className="ghost sbtn" href={INSTAGRAM} target="_blank" rel="noopener noreferrer" onClick={() => trackInterest("follow_instagram")}>Instagram · @topecripto</a>
          </div>
        </div>
      </div>
      <div className="locked">
        <div className="preview">{rows}</div>
        <div className="overlay"><strong>Detector de tablas</strong><p>Pega la tabla de precios de un influencer y te marca qué objetivos rompen la aritmética.</p></div>
      </div>
      <div className="plan planFree">
        <div className="head"><span className="name">Gratis</span><span className="price">0 €</span></div>
        <ul className="free"><li>Diagnóstico de cualquier predicción</li><li>El juego de los ceros</li><li>3 casos de «Quién prometió qué»</li><li>Compartir el veredicto</li></ul>
      </div>
      <p className="note">Pro aún no está abierto y no se cobra nada.</p>
      <button className="ghost" type="button" onClick={onBack}>← Volver al diagnóstico</button>
    </section>
  );
}

// Detector (solo con acceso completo)
function Detector({ coins, total }) {
  const [txt, setTxt] = useState("XRP 100\nSOL 1000\nDOGE 10\nSHIB 1\nPEPE 0,01");
  const [rows, setRows] = useState(null);
  const run = () => setRows(txt.split("\n").map((ln) => {
    const sm = ln.match(/[A-Za-z]{2,6}/), nm = ln.match(/[\d.,]+/g);
    if (!sm || !nm) return null;
    const sym = sm[0].toUpperCase(), c = coins.find((x) => x.sym === sym), pr = parseEs(nm[nm.length - 1]);
    if (!c || !pr) return { sym, bad: true };
    const cap = pr * c.supply; return { sym, pr, cap, z: zone(cap, total) };
  }).filter(Boolean));
  return (
    <div className="stack">
      <div><h2 className="sec">Detector de tablas</h2><p className="lead">Una moneda y su precio por línea. Te marca cuáles rompen la aritmética.</p></div>
      <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={6} spellCheck={false} className="finput mono" />
      <button className="btn" type="button" onClick={run}>Analizar</button>
      {rows && rows.map((r, i) => r.bad
        ? <div className="row" key={i}><b>{r.sym}</b><span className="m">no reconocida</span></div>
        : <div className="row" key={i}><b>{r.sym}</b><span className="p">{fmtPrice(r.pr)}</span><span className="m">{fmtCap(r.cap)}</span><span className="t" style={{ background: r.z.c }}>{r.z.t}</span></div>)}
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Rajdhani:wght@600;700&display=swap');
.tc-root{min-height:100%;background:#05070a;color:#c7d0dc;font-family:'Chakra Petch',system-ui,sans-serif;padding:14px 16px}
.tc-root *{box-sizing:border-box}
.phone{max-width:400px;margin:0 auto;background:radial-gradient(120% 70% at 50% 0%,#12161d,#0b0f15 60%,#080a0e);border:1px solid #1c232d;border-radius:22px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:12px}
.phone>*,.stack>*{min-width:0}
.stack{display:grid;gap:12px}
.mono{font-family:'Chakra Petch',monospace;letter-spacing:.08em}
.disp{font-family:'Rajdhani',sans-serif;font-weight:700}
.top{display:flex;align-items:center;justify-content:space-between}
.brand{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:18px;letter-spacing:.06em;color:#fff}
.brand b{color:#ff2d2d}
.live{font-size:9px;letter-spacing:.1em;color:#5b6675;display:flex;align-items:center;gap:5px}
.live i{width:6px;height:6px;border-radius:50%;display:inline-block;animation:blink 1.4s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.chip{font:700 10.5px 'Chakra Petch',sans-serif;letter-spacing:.06em;color:#ffd35a;background:#16120a;border:1px solid #6b5315;border-radius:8px;padding:7px 11px;cursor:pointer}
.chipFull{color:#0b0e13;background:linear-gradient(90deg,#ffd35a,#e0a92e)}
h1{font-family:'Rajdhani',sans-serif;font-size:27px;line-height:1.1;color:#fff;margin:4px 0 6px;text-wrap:balance}
.sec{font-family:'Rajdhani',sans-serif;font-size:21px;color:#fff;margin:0 0 2px}
.lead{font-size:12.5px;color:#8891a8;line-height:1.5;margin:0}
.nav{display:flex;gap:5px;background:#0b0f15;padding:4px;border-radius:11px}
.nav button{flex:1;padding:8px 0;font:600 12px 'Chakra Petch',sans-serif;color:#7b8696;background:transparent;border:0;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.nav button[aria-selected="true"]{background:#e9f0f7;color:#0b0e13}
.pill{font-size:9px;font-weight:700;background:#ffd35a;color:#0b0e13;padding:2px 6px;border-radius:4px}
.coins{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}
.coins::-webkit-scrollbar{height:0}
.coins button{flex-shrink:0;padding:7px 12px;font:600 12px 'Chakra Petch',sans-serif;color:#7b8696;background:#0e131a;border:1px solid #1c232d;border-radius:9px;cursor:pointer}
.coins button[aria-pressed="true"]{color:#0b0e13;background:#e9f0f7;border-color:#e9f0f7}
.ask{display:flex;align-items:center;gap:8px;background:#0b0f15;border:1px solid #1c232d;border-radius:12px;padding:8px 10px}
.ask:focus-within{border-color:#4a5563}
.ask label{font-size:12px;color:#8891a8;white-space:nowrap}
.ask input{flex:1;min-width:0;width:100%;background:transparent;border:0;outline:none;color:#fff;font:700 24px 'Rajdhani',sans-serif;text-align:right}
.ask span{font:700 18px 'Rajdhani',sans-serif;color:#8891a8}
svg{display:block;width:100%;height:auto}
.rng{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:6px;background:linear-gradient(90deg,#35c759,#ffb02e,#ff7a1a,#ff2d2d);outline:none}
.rng::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#0b0e13;border:2px solid #e9f0f7;cursor:pointer}
.rng::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#0b0e13;border:2px solid #e9f0f7;cursor:pointer}
.tc-root button:focus-visible,.tc-root a:focus-visible,.rng:focus-visible{outline:2px solid #ffd35a;outline-offset:2px}
.reads{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.read{background:#0e131a;border:1px solid #1c232d;border-radius:10px;padding:9px 5px;text-align:center}
.read small{display:block;font-size:8px;letter-spacing:.06em;color:#5b6675;margin-bottom:4px}
.read b{font:700 18px 'Rajdhani',sans-serif;color:#e9f0f7;font-variant-numeric:tabular-nums}
.verdict{display:flex;align-items:center;gap:10px;background:#0b0f15;border:1px solid;border-radius:12px;padding:11px 12px}
.verdict .tag{font:700 13px 'Rajdhani',sans-serif;letter-spacing:.06em;color:#0b0e13;padding:4px 9px;border-radius:6px;flex-shrink:0}
.verdict p{margin:0;font-size:12px;color:#aab4c0;line-height:1.4}
.compare{text-align:center;font-size:12px;color:#8891a8;margin:0}
.btn{width:100%;padding:13px 0;font:700 14px 'Chakra Petch',sans-serif;color:#0b0e13;background:linear-gradient(180deg,#ff4d4d,#e01e1e);border:0;border-radius:12px;cursor:pointer;box-shadow:0 6px 20px rgba(224,30,30,.35)}
.ghost{width:100%;padding:12px 0;font:600 13px 'Chakra Petch',sans-serif;color:#c7d0dc;background:#0e131a;border:1px solid #232a35;border-radius:11px;cursor:pointer}
.btn:disabled,.ghost:disabled{opacity:.4;cursor:default}
.share{color:#ff5b5b;background:#160d0f;border-color:#7a2020;font-weight:700}
details{background:#0b0f15;border:1px solid #1c232d;border-radius:12px;padding:10px 12px}
summary{cursor:pointer;font-size:12.5px;font-weight:600;color:#e9f0f7}
details ol{margin:10px 0 0;padding-left:18px;font-size:12px;color:#8891a8;line-height:1.5;display:grid;gap:6px}
.zbox{background:#0b0f15;border:1px solid #1c232d;border-radius:14px;padding:14px 12px;text-align:center;display:grid;gap:6px}
.zbox small{font-size:9px;letter-spacing:.08em;color:#5b6675}
.zprice{font:700 30px 'Rajdhani',sans-serif;color:#fff;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.zprice em{font-style:normal;color:#ff2d2d;text-decoration:line-through}
.zbtns{display:grid;grid-template-columns:1fr 1.4fr;gap:8px}
.case{background:#0b0f15;border:1px solid #1c232d;border-radius:12px;padding:12px;display:grid;gap:6px}
.case .who{display:flex;justify-content:space-between;align-items:center;gap:8px}
.case .who b{color:#e9f0f7;font-size:13.5px}
.case .t,.row .t{font-size:9.5px;font-weight:700;color:#0b0e13;padding:3px 7px;border-radius:5px;flex-shrink:0}
.case .claim{font:700 19px 'Rajdhani',sans-serif;color:#fff}
.case p{margin:0;font-size:12px;color:#8891a8;line-height:1.45}
.case a{color:#8891a8;font-size:10.5px}
.locked{position:relative;border-radius:14px;overflow:hidden;border:1px solid #1c232d}
.locked .preview{filter:blur(3px);opacity:.45;padding:12px;display:grid;gap:6px;pointer-events:none}
.row{display:flex;align-items:center;gap:8px;background:#0b0f15;border:1px solid #1c232d;border-radius:9px;padding:9px 11px;font-size:12px}
.row b{width:48px;color:#e9f0f7}
.row .p{width:74px;font:700 15px 'Rajdhani',sans-serif}
.row .m{flex:1;text-align:right;color:#8891a8}
.overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:18px;background:linear-gradient(180deg,rgba(11,15,21,.55),rgba(11,15,21,.92))}
.overlay strong{color:#e9f0f7;font-size:15px}
.overlay p{margin:0;font-size:12px;color:#8891a8;line-height:1.45}
.plan{background:linear-gradient(180deg,#151119,#0b0f15);border:1px solid #7a5a10;border-radius:16px;padding:18px 15px 16px;display:grid;gap:10px}
.planFree{border-color:#1c232d;background:#0b0f15}
.planFree .name{color:#8891a8!important}
.plan .head{display:flex;align-items:baseline;justify-content:space-between}
.plan .name{font:700 26px 'Rajdhani',sans-serif;color:#ffd35a;letter-spacing:.04em}
.plan .price{font:700 30px 'Rajdhani',sans-serif;color:#fff}
.plan .price small{font:400 12px 'Chakra Petch',sans-serif;color:#7b8696}
.plan ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}
.plan li{font-size:12.5px;color:#aab4c0;display:flex;gap:8px;line-height:1.35}
.plan li::before{content:"★";color:#ffd35a}
.plan .free li::before{content:"✓";color:#35c759}
.gold{width:100%;padding:13px 0;font:700 14px 'Chakra Petch',sans-serif;color:#0b0e13;background:linear-gradient(180deg,#ffd35a,#e0a92e);border:0;border-radius:12px;cursor:pointer}
.flabel{margin:0;font-size:11.5px;color:#aab4c0}
.finput{width:100%;background:#0b0f15;border:1px solid #2a323d;border-radius:10px;color:#e9f0f7;font-size:13px;padding:11px;outline:none;resize:vertical;line-height:1.6}
.social{display:grid;gap:8px}
.sbtn{display:block;text-align:center;text-decoration:none}
a.ghost.sbtn{color:#e9f0f7}
.note{font-size:10.5px;color:#5b6675;text-align:center;line-height:1.5;margin:0}
.foot{display:flex;justify-content:space-between;gap:8px;font-size:9.5px;color:#454f5b;padding-top:6px;border-top:1px solid #1c232d}
@media (prefers-reduced-motion:reduce){.tc-root *{transition:none!important;animation:none!important}}
`;
