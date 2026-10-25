// Genera las imágenes que salen al compartir un enlace (WhatsApp, Telegram, X…).
// NO se ejecuta en Vercel: se ejecuta a mano (lo hace Claude) cada vez que se añade una promesa,
// y las imágenes se suben al repo en public/og/. Si una promesa no tiene imagen,
// la web usa public/og/portada.png, así que nunca se rompe nada.
//
// Uso:  node scripts/og-imagenes.mjs      (necesita Playwright con Chromium)

import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { CASES, ST_COLOR } from "../src/promesas.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = new URL("../public/og/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const NAMES = {
  BTC: "Bitcoin", ETH: "Ethereum", XRP: "XRP", SOL: "Solana", DOGE: "Dogecoin", ADA: "Cardano",
  SHIB: "Shiba Inu", PEPE: "Pepe", HYPE: "Hyperliquid", LINK: "Chainlink", XLM: "Stellar", HBAR: "Hedera",
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const shell = (inner) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:'Inter Display','Inter',sans-serif;color:#e9f0f7;
  background:radial-gradient(120% 90% at 15% 0%,#161b24 0%,#0b0f15 55%,#05070a 100%)}
.wrap{position:absolute;inset:0;padding:56px 70px;display:flex;flex-direction:column}
.brand{font-weight:800;font-size:34px;letter-spacing:.06em;color:#fff}
.brand b{color:#ff2d2d}
.top{display:flex;justify-content:space-between;align-items:center}
.pill{font-weight:800;font-size:30px;letter-spacing:.06em;color:#0b0e13;padding:10px 22px;border-radius:12px}
.who{margin-top:54px;font-weight:600;font-size:34px;color:#aab4c0}
.claim{margin-top:10px;font-weight:800;font-size:76px;line-height:1.05;color:#fff;letter-spacing:-.01em}
.res{margin-top:26px;font-weight:600;font-size:38px;color:#ffd35a}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;font-size:26px;color:#7b8696}
.foot b{color:#e9f0f7;font-weight:700}
.bar{position:absolute;left:0;top:0;bottom:0;width:14px}
</style></head><body>${inner}</body></html>`;

const caseCard = (k) => {
  const c = ST_COLOR[k.st] || "#e9f0f7";
  const claimSize = k.claim.length > 26 ? 64 : 76;
  return shell(`<div class="bar" style="background:${c}"></div><div class="wrap">
  <div class="top"><div class="brand">TOPE<b>CRIPTO</b></div><div class="pill" style="background:${c}">${esc(k.st)}</div></div>
  <div class="who">${esc(k.who)} prometió ${esc(NAMES[k.coin] || k.coin)} a…</div>
  <div class="claim" style="font-size:${claimSize}px">${esc(k.claim)}</div>
  ${k.res ? `<div class="res">${esc(k.res)}</div>` : ""}
  <div class="foot"><span>Quién prometió qué · con fecha y fuente</span><b>topecripto.com</b></div>
</div>`);
};

const plainCard = (title, sub, line) => shell(`<div class="bar" style="background:#ff2d2d"></div><div class="wrap">
  <div class="top"><div class="brand">TOPE<b>CRIPTO</b></div></div>
  <div class="claim" style="margin-top:70px;font-size:78px">${title}</div>
  <div class="res" style="color:#aab4c0;font-size:36px">${sub}</div>
  <div class="foot"><span>${line}</span><b>topecripto.com</b></div>
</div>`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
async function shot(html, name) {
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL(name, OUT).pathname });
}

for (const k of CASES) await shot(caseCard(k), `${k.id}.png`);
await shot(plainCard("¿Ese precio que te prometen<br>es posible?", "Mídelo contra el dinero que existe de verdad.", "Sin hype, solo números"), "portada.png");
await shot(plainCard("Quién prometió qué", `${CASES.length} predicciones cripto con fecha y fuente:<br>las que fallaron y las que acertaron.`, "Bitcoin · Ethereum · XRP · Solana"), "promesas.png");
await browser.close();
console.log(`og: ${CASES.length} promesas + portada + promesas en public/og/`);
