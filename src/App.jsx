import React, { useState, useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

// ===== Referencias. TOTAL_CRYPTO se actualiza en vivo desde la API. =====
let TOTAL_CRYPTO = 2.16e12;            // fallback; se reemplaza con el dato en vivo
const APPLE = 3.5e12, GOLD = 18e12, POP = 8.1e9;   // referencias lentas (fijas)
// Datos de muestra: se usan solo si la API en vivo aún no ha respondido
const BASE = [
  { sym: "BTC",  name: "Bitcoin",    price: 63800, supply: 19.95e6, absurd: 1000000 },
  { sym: "ETH",  name: "Ethereum",   price: 1785,  supply: 120.7e6, absurd: 50000 },
  { sym: "XRP",  name: "XRP",        price: 1.06,  supply: 62.5e9,  absurd: 100 },
  { sym: "SOL",  name: "Solana",     price: 77,    supply: 590e6,   absurd: 375 },
  { sym: "HYPE", name: "Hyperliquid",price: 67,    supply: 334e6,   absurd: 500 },
  { sym: "LINK", name: "Chainlink",  price: 7.9,   supply: 680e6,   absurd: 10 },
  { sym: "XLM",  name: "Stellar",    price: 0.18,  supply: 31e9,    absurd: 3 },
  { sym: "HBAR", name: "Hedera",     price: 0.06,  supply: 50e9,    absurd: 2 },
  { sym: "DOGE", name: "Dogecoin",   price: 0.07,  supply: 148e9,   absurd: 0.30 },
];

// ===== Oferta Fundador (early access) — ajusta estos valores a mano =====
const FOUNDER_SPOTS = 200;      // plazas totales
const FOUNDER_TAKEN = 0;        // plazas ya reservadas (súbelo tú según vayan cayendo)
const FOUNDER_FORM_URL = "";    // opcional: pega aquí tu formulario (Tally/Google Forms) para capturar emails.
                                // Si lo dejas vacío, el botón solo cuenta el clic (modo demo, como el resto).

const CX = 200, CY = 200, R = 150, SWEEP = 125;
const polar = (cx, cy, r, a) => { const rad = (a * Math.PI) / 180; return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }; };
const arc = (cx, cy, r, a0, a1) => { const s = polar(cx, cy, r, a0), e = polar(cx, cy, r, a1); const l = Math.abs(a1 - a0) <= 180 ? 0 : 1; return `M ${s.x} ${s.y} A ${r} ${r} 0 ${l} 1 ${e.x} ${e.y}`; };
const mcapToT = (m) => { const lo = Math.log10(10e9), hi = Math.log10(10e12); return Math.max(0, Math.min(1, (Math.log10(Math.max(m, 1)) - lo) / (hi - lo))); };
const tToAngle = (t) => -SWEEP + t * 2 * SWEEP;
const T_G = mcapToT(250e9), T_A = mcapToT(1e12);
let T_R = mcapToT(TOTAL_CRYPTO);       // se recalcula al llegar el dato en vivo
function applyLiveTotal(total) { if (total && total > 0) { TOTAL_CRYPTO = total; T_R = mcapToT(total); } }
const zoneFor = (m) => m < 250e9 ? { col: "#35c759", code: "OK", tag: "POSIBLE", msg: "Dentro de parámetros de mercado" }
  : m < 1e12 ? { col: "#ffb02e", code: "P-0250", tag: "AGRESIVO", msg: "Exige un ciclo alcista fuerte" }
  : m < TOTAL_CRYPTO ? { col: "#ff7a1a", code: "P-1000", tag: "MUY IMPROBABLE", msg: "Rivalizaría con los mayores" }
  : { col: "#ff2d2d", code: "P-2160", tag: "IMPOSIBLE", msg: "Supera TODO el mercado cripto" };
const fmtMcap = (n) => n >= 1e12 ? "$" + (n / 1e12).toFixed(2) + " B" : n >= 1e9 ? "$" + (n / 1e9).toFixed(0) + " mil M" : n >= 1e6 ? "$" + (n / 1e6).toFixed(0) + " M" : "$" + Math.round(n).toLocaleString("es-ES");
const fmtPrice = (n) => n >= 1000 ? "$" + n.toLocaleString("es-ES", { maximumFractionDigits: 0 }) : n >= 1 ? "$" + n.toFixed(2) : "$" + n.toFixed(4);

export default function App() {
  const [screen, setScreen] = useState("welcome"); // welcome, how, signup, plans, app
  const [plan, setPlan] = useState("free");
  const [interest, setInterest] = useState({ pro: 0, over: 0, detector: 0, watch: 0, founder: 0 });
  const bump = (k) => setInterest((s) => ({ ...s, [k]: s[k] + 1 }));
  const [coins, setCoins] = useState(BASE);
  const [live, setLive] = useState(false);

  // Precios en vivo desde nuestra función de servidor (que oculta la clave).
  // BASE actúa de placeholder hasta que llegan los datos reales.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/prices");
        if (!r.ok) return;
        const d = await r.json();
        if (!alive || !d.coins || !d.coins.length) return;
        applyLiveTotal(d.totalCrypto);
        setCoins(d.coins);
        setLive(true);
      } catch { /* se queda con los datos de muestra */ }
    };
    load();
    const id = setInterval(load, 60000); // refresco cada minuto
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div style={S.root}>
      <style>{css}</style>
      <div style={S.phone}>
        {screen === "welcome" && <Welcome onNext={() => setScreen("how")} />}
        {screen === "how" && <How onNext={() => setScreen("signup")} onBack={() => setScreen("welcome")} />}
        {screen === "signup" && <Signup onNext={() => setScreen("plans")} />}
        {screen === "plans" && <Plans onEnter={() => { setPlan("free"); setScreen("app"); }} interest={interest} bump={bump} />}
        {screen === "app" && <Main coins={coins} live={live} onPlans={() => setScreen("plans")} onRestart={() => setScreen("welcome")} interest={interest} bump={bump} />}
      </div>
      {screen !== "app" && (
        <div style={S.progress}>
          {["welcome", "how", "signup", "plans"].map((s) => (
            <i key={s} style={{ ...S.pdot, background: screen === s ? "#ff2d2d" : "#2a323d" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== 1. BIENVENIDA =====
function Welcome({ onNext }) {
  return (
    <div style={S.screenCenter}>
      <div style={S.needleIcon}>
        <svg viewBox="0 0 120 120" width="112" height="112">
          <path d={arc(60, 66, 46, -125, 125)} stroke="#1c232d" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d={arc(60, 66, 46, 70, 125)} stroke="#ff2d2d" strokeWidth="8" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 5px #ff2d2d)" }} />
          <g className="sweepMini"><line x1="60" y1="66" x2="60" y2="26" stroke="#ff2d2d" strokeWidth="3.5" strokeLinecap="round" /></g>
          <circle cx="60" cy="66" r="7" fill="#0b0e13" stroke="#3a4453" strokeWidth="2" />
        </svg>
      </div>
      <div style={S.brandBig}>TOPE<span style={{ color: "#ff2d2d" }}>CRIPTO</span></div>
      <div style={S.welcomeTag}>¿Ese precio que te prometen es posible… o imposible?</div>
      <div style={S.welcomeSub}>Topecripto mide cualquier predicción de cripto contra el dinero que existe de verdad. En un segundo ves si cuadra o es humo.</div>
      <button onClick={onNext} style={S.ctaMain}>Empezar</button>
      <div style={S.welcomeFoot}>No es asesoramiento de inversión</div>
    </div>
  );
}

// ===== 2. CÓMO FUNCIONA =====
function How({ onNext, onBack }) {
  const steps = [
    { n: "1", t: "Coges una predicción", d: "Por ejemplo: «XRP llegará a 100 $». La que sea." },
    { n: "2", t: "La multiplicamos por las monedas que existen", d: "Cada cripto tiene un número de monedas en circulación. Precio × monedas = lo que valdría la moneda entera (su «capitalización»)." },
    { n: "3", t: "Lo comparamos con la realidad", d: "¿Esa cifra cabe en el mundo? La medimos contra todo el cripto que existe, la mayor empresa del planeta y todo el oro extraído." },
    { n: "4", t: "Te damos el veredicto", d: "Verde si es posible, rojo si esa predicción valdría más dinero del que existe. Sin opiniones: solo números." },
  ];
  return (
    <div style={S.screen}>
      <div style={S.howHead}>Cómo funciona</div>
      <div style={S.howLead}>Sin tecnicismos ni promesas. Solo una cuenta que casi nadie hace:</div>
      {steps.map((s) => (
        <div key={s.n} style={S.stepRow}>
          <div style={S.stepNum}>{s.n}</div>
          <div>
            <div style={S.stepT}>{s.t}</div>
            <div style={S.stepD}>{s.d}</div>
          </div>
        </div>
      ))}
      <div style={S.howExample}>
        <b style={{ color: "#ff5b5b" }}>Ejemplo real:</b> «XRP a 100 $» significaría que XRP valdría <b>3 veces más que TODO el cripto del mundo junto</b>. Por eso: imposible. Eso es lo que verás al instante.
      </div>
      <button onClick={onNext} style={S.ctaMain}>Lo entiendo, vamos</button>
      <button onClick={onBack} style={S.ctaGhost}>Atrás</button>
    </div>
  );
}

// ===== 3. REGISTRO =====
function Signup({ onNext }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const ok = email.includes("@") && pass.length >= 4;
  return (
    <div style={S.screen}>
      <div style={S.howHead}>Crea tu cuenta</div>
      <div style={S.howLead}>Para guardar tus análisis y tu watchlist. Nada de datos de pago todavía.</div>
      <label style={S.lbl}>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={S.input} type="email" />
      <label style={S.lbl}>Contraseña</label>
      <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="mínimo 4 caracteres" style={S.input} type="password" />
      <button onClick={onNext} disabled={!ok} style={{ ...S.ctaMain, opacity: ok ? 1 : 0.45 }}>Crear cuenta</button>
      <div style={S.orLine}><span style={S.orTxt}>o</span></div>
      <button onClick={onNext} style={S.ctaGhost}>Entrar como invitado</button>
      <div style={S.legal}>Al continuar aceptas los términos. Solo guardamos tu email; puedes borrarlo cuando quieras (RGPD).</div>
    </div>
  );
}

// ===== 4. PLANES =====
function Plans({ onEnter, interest, bump }) {
  const [msg, setMsg] = useState(null); // "pro" | "over"
  const feats = {
    free: ["Análisis completo de las 9 monedas", "Sin límites ni monedas capadas", "Compartir el veredicto"],
    pro: ["Todo lo de Free", "Detector de tablas de influencers", "Watchlist de objetivos", "Alertas"],
    over: ["Todo lo de Pro", "Proyección de dilución / FDV", "Historial de aciertos por «gurú»", "Acceso API"],
  };
  const soonMsg = {
    pro: "Estamos afinando al máximo una herramienta rápida, eficiente y potente, con datos de actualidad en vivo y contrastados, para que tomes tus decisiones con la realidad delante y no con el hype.",
    over: "El nivel más potente de Topecripto, con datos en vivo contrastados al máximo, para llevar tus decisiones como trader al siguiente nivel. En construcción.",
  };
  return (
    <div style={S.screen}>
      <div style={S.howHead}>Planes</div>
      <div style={S.howLead}>Empieza gratis con todo el análisis. Pro y Overdrive llegan muy pronto.</div>

      {/* OFERTA FUNDADOR */}
      <FounderOffer bump={bump} interest={interest} />

      {/* FREE */}
      <div style={{ ...S.planCard, borderColor: "#1c232d" }}>
        <div style={S.planTop}><span style={{ ...S.planName, color: "#8891a8" }}>Free</span><span style={S.planPrice}>0 €</span></div>
        {feats.free.map((f) => <div key={f} style={S.planFeat}><span style={{ color: "#35c759" }}>✓</span> {f}</div>)}
        <button onClick={() => { trackInterest("choose_free"); onEnter(); }} style={{ ...S.planCta, ...S.planCtaBest }}>Empezar gratis</button>
      </div>

      {/* PRO - muy pronto */}
      <div style={{ ...S.planCard, borderColor: "#1c232d", opacity: 0.96 }}>
        <div style={S.soonTag}>MUY PRONTO</div>
        <div style={S.planTop}><span style={{ ...S.planName, color: "#e9f0f7" }}>Pro</span><span style={S.planPrice}>3,99 €<span style={S.planSub}> /mes</span></span></div>
        {feats.pro.map((f) => <div key={f} style={S.planFeat}><span style={{ color: "#5b6675" }}>•</span> {f}</div>)}
        <button onClick={() => { bump("pro"); trackInterest("interest_pro"); setMsg("pro"); }} style={S.planCta}>Me interesa</button>
        {msg === "pro" && <div style={S.soonBox}><b style={{ color: "#e9f0f7" }}>Topecripto Pro — en construcción.</b> {soonMsg.pro}</div>}
      </div>

      {/* OVERDRIVE - muy pronto */}
      <div style={{ ...S.planCard, borderColor: "#4a3d15" }}>
        <div style={{ ...S.soonTag, background: "#e0a92e" }}>MUY PRONTO</div>
        <div style={S.planTop}><span style={{ ...S.planName, color: "#ffd35a" }}>Overdrive</span><span style={S.planPrice}>9,99 €<span style={S.planSub}> /mes</span></span></div>
        {feats.over.map((f) => <div key={f} style={S.planFeat}><span style={{ color: "#5b6675" }}>•</span> {f}</div>)}
        <button onClick={() => { bump("over"); trackInterest("interest_over"); setMsg("over"); }} style={S.planCta}>Me interesa</button>
        {msg === "over" && <div style={{ ...S.soonBox, borderColor: "#4a3d15" }}><b style={{ color: "#ffd35a" }}>Topecripto Overdrive — en construcción.</b> {soonMsg.over}</div>}
      </div>

      <div style={S.legal}>Nada se cobra todavía. «Me interesa» solo cuenta el interés (sin pedir datos). Cuando haya demanda, activaremos el pago.</div>
    </div>
  );
}

// ===== 5. APP =====
function Main({ coins, live, onPlans, onRestart, interest, bump }) {
  const [tab, setTab] = useState("diag");
  const [ci, setCi] = useState(2);
  const [price, setPrice] = useState((coins[2] || coins[0]).price * 0.3);
  const coin = coins[ci] || coins[0];

  return (
    <div style={S.appScreen}>
      <div style={S.appHeader}>
        <div style={S.brandWrap}>
          <span style={S.brand}>TOPE<span style={{ color: "#ff2d2d" }}>CRIPTO</span></span>
          <span style={S.live}><i style={{ ...S.dot, background: live ? "#35c759" : "#ffb02e", boxShadow: `0 0 6px ${live ? "#35c759" : "#ffb02e"}` }} />{live ? "EN VIVO" : "cargando…"}</span>
        </div>
        <button onClick={onPlans} style={S.planChip}>FREE · ver planes</button>
      </div>

      <div style={S.nav}>
        {[["diag", "Diagnóstico"], ["detect", "Detector"], ["watch", "Watchlist"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...S.navBtn, ...(tab === k ? S.navOn : {}) }}>
            {l}{k !== "diag" && <span style={S.proPill}>PRONTO</span>}
          </button>
        ))}
      </div>

      {tab === "diag" && <Diag coins={coins} ci={ci} setCi={setCi} price={price} setPrice={setPrice} />}
      {tab === "detect" && <ComingSoon k="detector" title="Detector de tablas" desc="Pega la tabla de un influencer y te marca en rojo qué objetivos rompen la aritmética. En construcción, con datos en vivo contrastados." interest={interest} bump={bump} />}
      {tab === "watch" && <ComingSoon k="watch" title="Watchlist" desc="Guarda tus objetivos y revísalos de un vistazo. En construcción." interest={interest} bump={bump} />}

      <div style={S.appFoot}>
        <span>{live ? "Datos en vivo · CoinGecko" : "Cargando datos en vivo…"} · No es asesoramiento</span>
        <button onClick={onRestart} style={S.restart}>↺ ver onboarding</button>
      </div>
    </div>
  );
}

function Diag({ coins, ci, setCi, price, setPrice }) {
  const coin = coins[ci] || coins[0];
  const raf = useRef(null); const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const c = coins[ci] || coins[0]; setPrice(c.price * 0.3); }, [ci]);
  const mcap = price * coin.supply, mult = price / coin.price, pct = (mcap / TOTAL_CRYPTO) * 100;
  const z = zoneFor(mcap), angle = tToAngle(mcapToT(mcap));
  const l2 = mcap > GOLD ? "Más que todo el oro del mundo" : mcap > APPLE ? `${(mcap / APPLE).toFixed(1)}× Apple` : mcap > TOTAL_CRYPTO ? `${(mcap / TOTAL_CRYPTO).toFixed(1)}× todo el cripto` : `${((mcap / GOLD) * 100).toFixed(1)}% del oro mundial`;
  const play = () => { if (playing) return; if (raf.current) cancelAnimationFrame(raf.current); const from = coin.price, to = coin.absurd, dur = 4200, t0 = performance.now(); setPlaying(true); setPrice(from); const step = (now) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); setPrice(from * Math.pow(to / from, e)); if (k < 1) raf.current = requestAnimationFrame(step); else setPlaying(false); }; raf.current = requestAnimationFrame(step); };
  const pMin = coin.price * 0.3, pMax = coin.price * 300, sVal = (Math.log(price / pMin) / Math.log(pMax / pMin)) * 1000;
  const share = async () => {
    const txt = `${coin.sym} a ${fmtPrice(price)} → ${z.tag}. Sería ${fmtMcap(mcap)} de capitalización (${l2}). Compruébalo en Topecripto:`;
    const url = "https://topecripto.com";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Topecripto", text: txt, url });
      } else {
        await navigator.clipboard.writeText(txt + " " + url);
        setCopied(true); setTimeout(() => setCopied(false), 2500);
      }
      trackInterest("share");
    } catch { /* el usuario canceló */ }
  };
  return (
    <div>
      <div style={S.coinRow} className="scroll">
        {coins.map((c, i) => <button key={c.sym} onClick={() => setCi(i)} style={{ ...S.coin, ...(i === ci ? S.coinOn : {}) }}>{c.sym}</button>)}
      </div>
      <svg viewBox="0 0 400 300" style={{ width: "100%", height: "auto" }}>
        <path d={arc(CX, CY, R, tToAngle(0), tToAngle(T_G))} stroke="#35c759" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d={arc(CX, CY, R, tToAngle(T_G), tToAngle(T_A))} stroke="#ffb02e" strokeWidth="14" fill="none" />
        <path d={arc(CX, CY, R, tToAngle(T_A), tToAngle(T_R))} stroke="#ff7a1a" strokeWidth="14" fill="none" />
        <path d={arc(CX, CY, R, tToAngle(T_R), tToAngle(1))} stroke="#ff2d2d" strokeWidth="14" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #ff2d2d)" }} />
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${CX}px ${CY}px`, transition: playing ? "none" : "transform .45s cubic-bezier(.2,.9,.2,1)" }}>
          <line x1={CX} y1={CY} x2={CX} y2={CY - (R - 8)} stroke={z.col} strokeWidth="4" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${z.col})` }} />
        </g>
        <circle cx={CX} cy={CY} r="12" fill="#0b0e13" stroke="#3a4453" strokeWidth="2" />
        <circle cx={CX} cy={CY} r="4" fill={z.col} />
        <text x={CX} y={CY - 58} textAnchor="middle" fill="#5b6675" fontSize="11" className="mono">PRECIO OBJETIVO</text>
        <text x={CX} y={CY - 24} textAnchor="middle" fontSize="34" className="disp" style={{ fill: "#e9f0f7" }}>{fmtPrice(price)}</text>
      </svg>
      <div style={S.throttle}>
        <span style={S.tLbl}>MENOS</span>
        <input type="range" min="0" max="1000" value={sVal} disabled={playing} onChange={(e) => { const r = +e.target.value / 1000; setPrice(pMin * Math.pow(pMax / pMin, r)); }} className="rng" style={{ flex: 1 }} />
        <span style={S.tLbl}>MÁS</span>
      </div>
      <div style={S.reads}>
        <Read l="CAPITALIZACIÓN" v={fmtMcap(mcap)} c={z.col} />
        <Read l="× HOY" v={"×" + (mult >= 100 ? Math.round(mult) : mult.toFixed(1))} />
        <Read l="DEL MERCADO" v={pct >= 100 ? (pct / 100).toFixed(1) + "×" : pct.toFixed(1) + "%"} c={pct >= 100 ? "#ff2d2d" : "#e9f0f7"} />
      </div>
      <div style={{ ...S.obd, borderColor: z.col + "55" }}>
        <span style={{ ...S.obdCode, background: z.col }}>{z.code}</span>
        <span style={S.obdMsg}>{z.msg}</span>
      </div>
      <div style={S.compare}>{l2}</div>
      <button onClick={play} disabled={playing} style={{ ...S.ctaGhost, marginTop: 4 }}>{playing ? "…" : "▶ Diagnóstico automático"}</button>
      <button onClick={share} style={S.ctaShare}>{copied ? "✓ Copiado al portapapeles" : "↗ Compartir veredicto"}</button>
    </div>
  );
}

function Detector({ coins }) {
  const [txt, setTxt] = useState("XRP 100\nBTC 130000\nSOL 375\nHYPE 500\nXLM 3\nHBAR 2\nDOGE 0.30");
  const [rows, setRows] = useState(null);
  const run = () => setRows(txt.split("\n").map((ln) => { const sm = ln.match(/[A-Za-z]{2,6}/), nm = ln.match(/[\d.,]+/g); if (!sm || !nm) return null; const sym = sm[0].toUpperCase(), c = coins.find((x) => x.sym === sym), pr = parseFloat(nm[nm.length - 1].replace(",", ".")); if (!c || !pr) return { sym, bad: true }; const mc = pr * c.supply; return { sym, pr, mc, z: zoneFor(mc) }; }).filter(Boolean));
  return (
    <div>
      <div style={S.secHead}>Pega la tabla de un influencer</div>
      <div style={S.secSub}>Una moneda y su precio por línea. Te marca cuáles rompen la aritmética.</div>
      <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={7} style={S.textarea} spellCheck={false} />
      <button onClick={run} style={{ ...S.ctaMain, marginTop: 8 }}>Analizar</button>
      {rows && <div style={{ marginTop: 12 }}>{rows.map((r, i) => r.bad ? <div key={i} style={S.resRow}><b style={S.resSym}>{r.sym}</b><span style={{ color: "#5b6675", fontSize: 12 }}>no reconocida</span></div> : (
        <div key={i} style={{ ...S.resRow, borderColor: r.z.col + "44" }}><b style={S.resSym}>{r.sym}</b><span style={S.resPrice}>{fmtPrice(r.pr)}</span><span style={S.resMcap}>{fmtMcap(r.mc)}</span><span style={{ ...S.resTag, background: r.z.col }}>{r.z.tag}</span></div>
      ))}</div>}
    </div>
  );
}

function Watchlist({ coins }) {
  const items = [{ sym: "XRP", t: 100 }, { sym: "SOL", t: 375 }, { sym: "HBAR", t: 2 }, { sym: "DOGE", t: 0.30 }];
  return (
    <div>
      <div style={S.secHead}>Tus objetivos guardados</div>
      <div style={S.secSub}>Revísalos cuando quieras (ejemplo precargado).</div>
      {items.map((it, i) => { const c = coins.find((x) => x.sym === it.sym); const mc = it.t * c.supply, z = zoneFor(mc); return (
        <div key={i} style={{ ...S.resRow, borderColor: z.col + "44" }}><b style={S.resSym}>{it.sym}</b><span style={S.resPrice}>{fmtPrice(it.t)}</span><span style={S.resMcap}>{fmtMcap(mc)}</span><span style={{ ...S.resTag, background: z.col }}>{z.tag}</span></div>
      ); })}
    </div>
  );
}

function ComingSoon({ k, title, desc, interest, bump }) {
  const [done, setDone] = useState(false);
  return (
    <div style={S.wall}>
      <div style={{ fontSize: 30 }}>🛠️</div>
      <div style={S.soonPill2}>MUY PRONTO</div>
      <div style={S.wallT}>{title}</div>
      <div style={S.wallD}>{desc}</div>
      {done ? (
        <div style={S.thanks}>Anotado. Gracias por la señal.</div>
      ) : (
        <button onClick={() => { bump(k); trackInterest("interest_" + k); setDone(true); }} style={S.ctaMain}>Me interesa esta función</button>
      )}
    </div>
  );
}

// Registra interés de forma SILENCIOSA (nada visible para el visitante).
// Tú lo consultas por tu lado: Vercel Analytics / Google Analytics si están,
// y siempre un contador local en el navegador (localStorage: "tc_founder_reserve").
function trackInterest(name) {
  try {
    track(name);                                         // Vercel Analytics (panel privado)
    if (typeof window !== "undefined") {
      const k = "tc_" + name;
      const n = parseInt(localStorage.getItem(k) || "0", 10) + 1;
      localStorage.setItem(k, String(n));                // respaldo local
    }
  } catch { /* sin ruido */ }
}

function FounderOffer({ bump, interest }) {
  const [done, setDone] = useState(false);
  // Contador VISIBLE: la base que fijas a mano (FOUNDER_TAKEN) + las reservas de esta sesión.
  const taken = Math.min(FOUNDER_SPOTS, FOUNDER_TAKEN + interest.founder);
  const left = Math.max(0, FOUNDER_SPOTS - taken);
  const pct = Math.min(100, (taken / FOUNDER_SPOTS) * 100);
  const reserve = () => {
    bump("founder");            // conteo interno de la sesión (no se muestra)
    trackInterest("founder_reserve"); // conteo privado real (oculto)
    setDone(true);
    if (FOUNDER_FORM_URL) window.open(FOUNDER_FORM_URL, "_blank", "noopener");
  };
  return (
    <div style={S.founderCard}>
      <div style={S.founderGlow} />
      <div style={S.founderTag}>OFERTA FUNDADOR · {FOUNDER_SPOTS} PLAZAS</div>
      <div style={S.founderTop}>
        <span style={S.founderName}>Fundador</span>
        <span style={S.founderPrice}>20 €<span style={S.planSub}> /año</span></span>
      </div>
      <div style={S.founderPitch}>Solo para los primeros {FOUNDER_SPOTS}. Cuando Pro y Overdrive se activen, entras al precio de fundador: por debajo del precio normal.</div>
      {["Acceso anticipado a Pro y Overdrive", "Precio de fundador, más barato que el normal", "Decides qué funciones se construyen primero"].map((f) => (
        <div key={f} style={S.planFeat}><span style={{ color: "#ffd35a" }}>★</span> {f}</div>
      ))}
      <div style={S.founderBarWrap}>
        <div style={S.founderBarBg}><div style={{ ...S.founderBarFill, width: pct + "%" }} /></div>
        <div style={S.founderBarLbl}>{taken} de {FOUNDER_SPOTS} plazas · quedan {left}</div>
      </div>
      {done ? (
        <div style={S.founderDone}>{FOUNDER_FORM_URL ? "¡Genial! Completa tus datos en la pestaña que se ha abierto." : "Plaza anotada. Te avisamos en cuanto activemos la oferta."}</div>
      ) : (
        <button onClick={reserve} style={S.founderCta}>Reservar mi plaza</button>
      )}
    </div>
  );
}

function Wall({ onGo, feature }) {
  return (
    <div style={S.wall}>
      <div style={{ fontSize: 32 }}>🔒</div>
      <div style={S.wallT}>{feature} está en Pro</div>
      <div style={S.wallD}>No te quitamos nada del gratis: esto son funciones nuevas. El diagnóstico completo lo tienes siempre.</div>
      <button onClick={onGo} style={S.ctaMain}>Ver planes</button>
    </div>
  );
}

const Read = ({ l, v, c }) => <div style={S.read}><div style={S.readL}>{l}</div><div style={{ ...S.readV, color: c || "#e9f0f7" }}>{v}</div></div>;

const css = `
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Rajdhani:wght@600;700&display=swap');
.mono{font-family:'Chakra Petch',monospace;letter-spacing:.08em;}
.disp{font-family:'Rajdhani',sans-serif;font-weight:700;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes sweepM{0%{transform:rotate(-125deg)}50%{transform:rotate(125deg)}100%{transform:rotate(72deg)}}
.sweepMini{transform-origin:60px 66px;animation:sweepM 2s cubic-bezier(.4,0,.2,1) forwards;}
.scroll::-webkit-scrollbar{height:0;}
.rng{-webkit-appearance:none;height:6px;border-radius:6px;background:linear-gradient(90deg,#35c759,#ffb02e,#ff7a1a,#ff2d2d);outline:none;}
.rng::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#0b0e13;border:2px solid #e9f0f7;box-shadow:0 0 8px rgba(255,255,255,.4);cursor:pointer;}
.rng::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#0b0e13;border:2px solid #e9f0f7;cursor:pointer;}
`;

const S = {
  root: { minHeight: "100%", background: "#05070a", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 10px", fontFamily: "'Chakra Petch',system-ui,sans-serif", color: "#c7d0dc" },
  phone: { width: "100%", maxWidth: 400, background: "radial-gradient(120% 70% at 50% 0%,#12161d,#0b0e13 60%,#080a0e)", border: "1px solid #1c232d", borderRadius: 22, padding: 18, boxShadow: "0 20px 60px rgba(0,0,0,.6)", minHeight: 560, display: "flex", flexDirection: "column" },
  progress: { display: "flex", gap: 7, marginTop: 12 },
  pdot: { width: 7, height: 7, borderRadius: "50%" },
  screenCenter: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "10px 4px" },
  screen: { flex: 1, display: "flex", flexDirection: "column" },
  needleIcon: { marginBottom: 6 },
  brandBig: { fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 32, letterSpacing: ".08em", color: "#fff", marginBottom: 14 },
  welcomeTag: { fontSize: 17, fontWeight: 600, color: "#e9f0f7", marginBottom: 10, lineHeight: 1.3 },
  welcomeSub: { fontSize: 13, color: "#8891a8", lineHeight: 1.5, marginBottom: 28, maxWidth: 300 },
  welcomeFoot: { fontSize: 10, color: "#454f5b", marginTop: 16 },
  ctaMain: { width: "100%", padding: "13px 0", fontSize: 14, fontWeight: 700, color: "#0b0e13", background: "linear-gradient(180deg,#ff4d4d,#e01e1e)", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", letterSpacing: ".02em", boxShadow: "0 6px 20px rgba(224,30,30,.35)" },
  ctaGhost: { width: "100%", padding: "12px 0", fontSize: 13, fontWeight: 600, color: "#c7d0dc", background: "#0e131a", border: "1px solid #232a35", borderRadius: 11, cursor: "pointer", fontFamily: "inherit", marginTop: 8 },
  ctaShare: { width: "100%", padding: "12px 0", fontSize: 13, fontWeight: 700, color: "#ff5b5b", background: "#160d0f", border: "1px solid #7a2020", borderRadius: 11, cursor: "pointer", fontFamily: "inherit", marginTop: 8, letterSpacing: ".02em" },
  howHead: { fontFamily: "'Rajdhani',sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 4 },
  howLead: { fontSize: 13, color: "#8891a8", lineHeight: 1.45, marginBottom: 16 },
  stepRow: { display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  stepNum: { flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "#ff2d2d", color: "#0b0e13", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani',sans-serif" },
  stepT: { fontSize: 14, fontWeight: 700, color: "#e9f0f7", marginBottom: 2 },
  stepD: { fontSize: 12.5, color: "#8891a8", lineHeight: 1.45 },
  howExample: { fontSize: 12.5, color: "#aab4c0", background: "#0b0f15", border: "1px solid #1c232d", borderRadius: 10, padding: 12, lineHeight: 1.5, margin: "4px 0 16px" },
  lbl: { fontSize: 11, letterSpacing: ".06em", color: "#7b8696", marginBottom: 5, marginTop: 12, textTransform: "uppercase" },
  input: { width: "100%", boxSizing: "border-box", background: "#0b0f15", border: "1px solid #1c232d", borderRadius: 10, color: "#e9f0f7", fontSize: 15, padding: "12px 13px", fontFamily: "inherit", outline: "none" },
  orLine: { textAlign: "center", borderTop: "1px solid #1c232d", margin: "20px 0 14px", position: "relative" },
  orTxt: { position: "relative", top: -10, background: "#0d1117", padding: "0 12px", fontSize: 12, color: "#5b6675" },
  legal: { fontSize: 10.5, color: "#5b6675", marginTop: 14, lineHeight: 1.5, textAlign: "center" },
  planCard: { position: "relative", background: "#0b0f15", border: "1px solid", borderRadius: 14, padding: "16px 14px", marginBottom: 12 },
  bestTag: { position: "absolute", top: -9, left: 14, background: "#ff2d2d", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 5, letterSpacing: ".08em" },
  planTop: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 },
  planName: { fontFamily: "'Rajdhani',sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: ".04em" },
  planPrice: { fontFamily: "'Rajdhani',sans-serif", fontSize: 26, fontWeight: 700, color: "#fff" },
  planSub: { fontSize: 12, color: "#7b8696", fontWeight: 400 },
  planFeat: { fontSize: 12.5, color: "#aab4c0", marginBottom: 7, display: "flex", gap: 8, lineHeight: 1.35 },
  planCta: { width: "100%", padding: "11px 0", marginTop: 10, fontSize: 13, fontWeight: 700, color: "#c7d0dc", background: "#141a22", border: "1px solid #2a323d", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" },
  planCtaBest: { color: "#0b0e13", background: "linear-gradient(180deg,#ff4d4d,#e01e1e)", border: "none" },
  appScreen: { flex: 1, display: "flex", flexDirection: "column" },
  soonTag: { position: "absolute", top: -9, left: 14, background: "#5b6675", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 5, letterSpacing: ".08em" },
  soonBox: { marginTop: 11, fontSize: 12, color: "#aab4c0", background: "#0b0f15", border: "1px solid #1c232d", borderRadius: 9, padding: "10px 11px", lineHeight: 1.5 },
  demoCount: { display: "block", marginTop: 7, fontSize: 10, color: "#ffd35a", letterSpacing: ".04em" },
  soonPill2: { display: "inline-block", background: "#e0a92e", color: "#0b0e13", fontSize: 9.5, fontWeight: 700, padding: "3px 9px", borderRadius: 5, letterSpacing: ".08em", margin: "8px 0 4px" },
  thanks: { fontSize: 13, color: "#35c759", fontWeight: 600, textAlign: "center" },
  appHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  brandWrap: { display: "flex", flexDirection: "column", lineHeight: 1.15 },
  brand: { fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: ".06em", color: "#fff" },
  live: { fontSize: 9, letterSpacing: ".1em", color: "#5b6675", display: "flex", alignItems: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#35c759", boxShadow: "0 0 6px #35c759", animation: "blink 1.4s infinite", display: "inline-block" },
  planChip: { fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", color: "#8891a8", background: "#0e131a", border: "1px solid #1c232d", borderRadius: 8, padding: "7px 11px", cursor: "pointer" },
  chipPro: { color: "#0b0e13", background: "#e9f0f7", borderColor: "#e9f0f7" },
  chipOver: { color: "#0b0e13", background: "linear-gradient(90deg,#ffd35a,#e0a92e)", borderColor: "#e0a92e" },
  nav: { display: "flex", gap: 5, background: "#0b0f15", padding: 4, borderRadius: 11, marginBottom: 12 },
  navBtn: { flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 600, color: "#7b8696", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 },
  navOn: { background: "#e9f0f7", color: "#0b0e13" },
  proPill: { fontSize: 8, fontWeight: 700, background: "#e0a92e", color: "#0b0e13", padding: "1px 4px", borderRadius: 4 },
  coinRow: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 2 },
  coin: { flexShrink: 0, padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "#7b8696", background: "#0e131a", border: "1px solid #1c232d", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" },
  coinOn: { color: "#0b0e13", background: "#e9f0f7", borderColor: "#e9f0f7" },
  throttle: { display: "flex", alignItems: "center", gap: 10, margin: "0 4px 12px" },
  tLbl: { fontSize: 9, letterSpacing: ".1em", color: "#4b5563" },
  reads: { display: "flex", gap: 7, marginBottom: 10 },
  read: { flex: 1, background: "#0e131a", border: "1px solid #1c232d", borderRadius: 10, padding: "9px 5px", textAlign: "center" },
  readL: { fontSize: 8, letterSpacing: ".06em", color: "#5b6675", marginBottom: 4, minHeight: 18 },
  readV: { fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 18 },
  obd: { display: "flex", alignItems: "center", gap: 9, background: "#0b0f15", border: "1px solid", borderRadius: 10, padding: "9px 11px", marginBottom: 9 },
  obdCode: { fontFamily: "'Chakra Petch',monospace", fontWeight: 700, fontSize: 11.5, color: "#0b0e13", padding: "3px 7px", borderRadius: 6, flexShrink: 0 },
  obdMsg: { fontSize: 11.5, color: "#aab4c0" },
  compare: { textAlign: "center", fontSize: 11.5, color: "#7b8696", marginBottom: 6 },
  secHead: { fontSize: 15, fontWeight: 700, color: "#e9f0f7", marginBottom: 3 },
  secSub: { fontSize: 12, color: "#7b8696", marginBottom: 10, lineHeight: 1.35 },
  textarea: { width: "100%", boxSizing: "border-box", background: "#0b0f15", border: "1px solid #1c232d", borderRadius: 10, color: "#e9f0f7", fontFamily: "'Chakra Petch',monospace", fontSize: 13, padding: 11, resize: "vertical", lineHeight: 1.6 },
  resRow: { display: "flex", alignItems: "center", gap: 8, background: "#0b0f15", border: "1px solid #1c232d", borderRadius: 9, padding: "9px 11px", marginBottom: 6 },
  resSym: { fontWeight: 700, color: "#e9f0f7", fontSize: 13, width: 50 },
  resPrice: { fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: "#c7d0dc", fontSize: 15, width: 72 },
  resMcap: { flex: 1, fontSize: 12, color: "#8891a8", textAlign: "right" },
  resTag: { fontSize: 9.5, fontWeight: 700, color: "#0b0e13", padding: "3px 7px", borderRadius: 5 },
  founderCard: { position: "relative", overflow: "hidden", background: "linear-gradient(180deg,#151119,#0b0f15)", border: "1px solid #7a5a10", borderRadius: 14, padding: "18px 15px 16px", marginBottom: 14, boxShadow: "0 10px 30px rgba(224,169,46,.14)" },
  founderGlow: { position: "absolute", top: -45, right: -35, width: 130, height: 130, background: "radial-gradient(circle,rgba(224,169,46,.35),transparent 70%)", pointerEvents: "none" },
  founderTag: { position: "relative", display: "inline-block", background: "linear-gradient(90deg,#ffd35a,#e0a92e)", color: "#0b0e13", fontSize: 9.5, fontWeight: 700, padding: "3px 9px", borderRadius: 5, letterSpacing: ".08em", marginBottom: 11 },
  founderTop: { position: "relative", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 },
  founderName: { fontFamily: "'Rajdhani',sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: ".04em", color: "#ffd35a" },
  founderPrice: { fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, color: "#fff" },
  founderPitch: { position: "relative", fontSize: 12.5, color: "#aab4c0", lineHeight: 1.5, marginBottom: 12 },
  founderBarWrap: { position: "relative", margin: "13px 0 4px" },
  founderBarBg: { height: 8, borderRadius: 6, background: "#1c232d", overflow: "hidden" },
  founderBarFill: { height: "100%", borderRadius: 6, background: "linear-gradient(90deg,#ffd35a,#e0a92e)", transition: "width .5s" },
  founderBarLbl: { fontSize: 10.5, color: "#ffd35a", marginTop: 6, letterSpacing: ".04em" },
  founderCta: { position: "relative", width: "100%", padding: "13px 0", marginTop: 12, fontSize: 14, fontWeight: 700, color: "#0b0e13", background: "linear-gradient(180deg,#ffd35a,#e0a92e)", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", letterSpacing: ".02em", boxShadow: "0 6px 20px rgba(224,169,46,.3)" },
  founderDone: { position: "relative", fontSize: 12.5, color: "#35c759", fontWeight: 600, textAlign: "center", marginTop: 12, lineHeight: 1.5 },
  wall: { textAlign: "center", padding: "36px 20px", background: "#0b0f15", border: "1px solid #1c232d", borderRadius: 14 },
  wallT: { fontSize: 16, fontWeight: 700, color: "#e9f0f7", margin: "8px 0 6px" },
  wallD: { fontSize: 12.5, color: "#8891a8", lineHeight: 1.45, marginBottom: 16 },
  appFoot: { marginTop: "auto", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9, color: "#454f5b" },
  restart: { fontSize: 9.5, color: "#5b6675", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" },
};
