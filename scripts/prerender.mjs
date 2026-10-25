// Se ejecuta después de "vite build" (ver package.json).
// Genera una página HTML por cada promesa de src/promesas.js, una para /promesas,
// el sitemap.xml y el robots.txt. Así Google lee el texto sin tener que ejecutar React.
// Cuando el visitante entra, React toma el control y la app funciona igual que siempre.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { CASES } from "../src/promesas.js";

const SITE = "https://www.topecripto.com";
const DIST = new URL("../dist/", import.meta.url);
const NAMES = {
  BTC: "Bitcoin", ETH: "Ethereum", XRP: "XRP", SOL: "Solana", DOGE: "Dogecoin", ADA: "Cardano",
  SHIB: "Shiba Inu", PEPE: "Pepe", HYPE: "Hyperliquid", LINK: "Chainlink", XLM: "Stellar", HBAR: "Hedera",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cut = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");
const coinName = (sym) => NAMES[sym] || sym;
const caseText = (k) =>
  (k.p || `Predicción en curso. Entra para ver, con el precio de hoy, cuánto dinero haría falta para que ${coinName(k.coin)} llegue a esa cifra.`)
  + (k.extra ? " " + k.extra : "");

const template = readFileSync(new URL("index.html", DIST), "utf8");

function swap(html, re, value, what) {
  if (!re.test(html)) throw new Error(`prerender: no encuentro ${what} en dist/index.html`);
  return html.replace(re, value);
}

function page({ path, title, description, type = "website", body }) {
  const url = SITE + path;
  let html = template;
  html = swap(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, "<title>");
  html = swap(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`, "meta description");
  html = swap(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`, "og:title");
  html = swap(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`, "og:description");
  html = swap(html, /<meta property="og:type"[^>]*>/,
    `<meta property="og:type" content="${type}" />\n    <meta property="og:url" content="${url}" />\n    <link rel="canonical" href="${url}" />\n    <meta name="twitter:card" content="summary" />`,
    "og:type");
  html = swap(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`, '<div id="root">');
  const dir = new URL("." + path + "/", DIST);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL("index.html", dir), html);
}

// Estilo mínimo para el instante antes de que cargue React (y para quien no ejecute JS)
const pre = (inner) =>
  `<article style="max-width:400px;margin:0 auto;padding:24px 18px;font-family:system-ui,sans-serif;color:#c7d0dc;line-height:1.5">${inner}</article>`;
const statusColor = { FALLIDA: "#ff2d2d", "EN CURSO": "#ffb02e", CUMPLIDA: "#35c759" };

function caseBlock(k, h) {
  return `<${h} style="color:#fff;margin:0 0 6px">${esc(k.who)} · ${esc(coinName(k.coin))}: ${esc(k.claim)}</${h}>
<p style="margin:0 0 6px"><strong style="color:${statusColor[k.st] || "#fff"}">${esc(k.st)}</strong></p>
<p style="margin:0 0 6px">${esc(caseText(k))}</p>
<p style="margin:0 0 18px"><a style="color:#8891a8" href="${esc(k.src)}" rel="noopener noreferrer">Fuente: ${esc(k.sn)}</a>${k.src2 ? ` · <a style="color:#8891a8" href="${esc(k.src2)}" rel="noopener noreferrer">${esc(k.sn2)}</a>` : ""}</p>`;
}

// 1) Una página por promesa
for (const k of CASES) {
  if (!/^[a-z0-9-]+$/.test(k.id)) throw new Error(`prerender: id no válido "${k.id}" (solo minúsculas, números y guiones)`);
  page({
    path: "/promesas/" + k.id,
    type: "article",
    title: cut(`${k.who}: ${coinName(k.coin)} a ${k.claim} · ${k.st} | Topecripto`, 90),
    description: cut(caseText(k), 160),
    body: pre(caseBlock(k, "h1") + `<p><a style="color:#ffd35a" href="/promesas">Ver todas las promesas</a> · <a style="color:#ffd35a" href="/">Comprobar otra predicción</a></p>`),
  });
}

// 2) La lista completa
page({
  path: "/promesas",
  title: "Quién prometió qué: predicciones cripto con fecha y resultado | Topecripto",
  description: cut(`Predicciones públicas de precios cripto, con fecha, fuente y lo que pasó de verdad. ${CASES.length} casos.`, 160),
  body: pre(`<h1 style="color:#fff;margin:0 0 6px">Quién prometió qué</h1><p style="margin:0 0 18px">Predicciones públicas, con fecha, y lo que pasó de verdad.</p>`
    + CASES.map((k) => caseBlock(k, "h2").replace(/<h2 /, `<h2 id="${k.id}" `)).join("\n")),
});

// 3) sitemap.xml y robots.txt
const urls = ["/", "/promesas", ...CASES.map((k) => "/promesas/" + k.id)];
writeFileSync(new URL("sitemap.xml", DIST),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map((u) => `  <url><loc>${SITE}${u === "/" ? "/" : u}</loc></url>`).join("\n")
  + `\n</urlset>\n`);
writeFileSync(new URL("robots.txt", DIST), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`prerender: ${CASES.length} promesas + /promesas + sitemap.xml + robots.txt`);
