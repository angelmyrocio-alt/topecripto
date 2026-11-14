// Se ejecuta después de "vite build" (ver package.json).
// Genera HTML con texto de verdad para cada página: la portada, los ceros, el
// indicador, la lista de promesas y una página por promesa. Más el sitemap.xml,
// el robots.txt y el llms.txt. Así buscadores y asistentes de IA leen el
// contenido sin ejecutar React. Cuando el visitante entra, React toma el control
// y la app funciona igual que siempre.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { CASES } from "../src/promesas.js";
import { FAQ } from "../src/faq.js";

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

// Imagen al compartir: la de la página si existe en public/og/, si no la portada
const ogImage = (name) =>
  SITE + "/og/" + (existsSync(new URL(`../public/og/${name}.png`, import.meta.url)) ? name : "portada") + ".png";

// ===== Datos estructurados =====
const PUBLISHER = {
  "@type": "Organization",
  name: "Topecripto",
  url: SITE,
  logo: SITE + "/icon.png",
  sameAs: ["https://t.me/topecripto", "https://www.instagram.com/topecripto", "https://www.tiktok.com/@topecripto.app"],
};

const APP_LD = {
  "@type": "WebApplication",
  name: "Topecripto",
  url: SITE,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Cualquiera con navegador",
  inLanguage: "es",
  isAccessibleForFree: true,
  description: "Comprueba si el precio que prometen para una criptomoneda es posible: multiplica ese precio por las monedas en circulación y lo compara con el dinero que existe de verdad en el mercado.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  featureList: [
    "Diagnóstico de cualquier predicción de precio",
    "El juego de los ceros",
    "Registro público de predicciones con fecha, fuente y resultado",
    "Detector de tablas de precios de influencers",
    "Indicador Tope: recorrido habitual y extremo a 1 día, 1 semana y 1 mes",
  ],
  publisher: PUBLISHER,
};

const FAQ_LD = {
  "@type": "FAQPage",
  inLanguage: "es",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const graph = (nodes) => JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });

function page({ path, title, description, type = "website", image, body, jsonld }) {
  const url = SITE + path;
  let html = template;
  html = swap(html, /<meta property="og:image" [^>]*>/, `<meta property="og:image" content="${image}" />`, "og:image");
  html = swap(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, "<title>");
  html = swap(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`, "meta description");
  html = swap(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`, "og:title");
  html = swap(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`, "og:description");
  html = swap(html, /<meta property="og:type"[^>]*>/,
    `<meta property="og:type" content="${type}" />\n    <meta property="og:url" content="${url}" />\n    <link rel="canonical" href="${url}" />`,
    "og:type");
  html = swap(html, /<script type="application\/ld\+json" data-tc-jsonld>[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${jsonld.replace(/</g, "\\u003c")}</script>`, "bloque JSON-LD");
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

const faqBlock = () =>
  `<h2 style="color:#fff;margin:24px 0 10px">Preguntas frecuentes</h2>`
  + FAQ.map((f) => `<h3 style="color:#fff;margin:14px 0 4px;font-size:15px">${esc(f.q)}</h3><p style="margin:0 0 10px">${esc(f.a)}</p>`).join("\n");

const navBlock = () =>
  `<p style="margin:18px 0 0"><a style="color:#ffd35a" href="/">Comprobar una predicción</a> · <a style="color:#ffd35a" href="/indicador">Indicador Tope</a> · <a style="color:#ffd35a" href="/ceros">El juego de los ceros</a> · <a style="color:#ffd35a" href="/promesas">Quién prometió qué</a></p>
<p style="margin:10px 0 0">Todo gratis y sin registro. Las dudas se responden por Telegram: <a style="color:#ffd35a" href="https://t.me/topecripto" rel="noopener noreferrer">t.me/topecripto</a>.</p>
<p style="margin:10px 0 0;color:#8891a8;font-size:13px">Topecripto hace aritmética con datos públicos. No es asesoramiento financiero.</p>`;

// 1) Una página por promesa
for (const k of CASES) {
  if (!/^[a-z0-9-]+$/.test(k.id)) throw new Error(`prerender: id no válido "${k.id}" (solo minúsculas, números y guiones)`);
  const title = cut(`${k.who}: ${coinName(k.coin)} a ${k.claim} · ${k.st} | Topecripto`, 90);
  page({
    path: "/promesas/" + k.id,
    type: "article",
    image: ogImage(k.id),
    title,
    description: cut(caseText(k), 160),
    jsonld: graph([
      {
        "@type": "Article",
        headline: cut(`${k.who} · ${coinName(k.coin)}: ${k.claim}`, 110),
        description: cut(caseText(k), 250),
        url: SITE + "/promesas/" + k.id,
        inLanguage: "es",
        about: { "@type": "Thing", name: coinName(k.coin) },
        citation: [k.src, k.src2].filter(Boolean),
        publisher: PUBLISHER,
      },
    ]),
    body: pre(caseBlock(k, "h1") + `<p><a style="color:#ffd35a" href="/promesas">Ver todas las promesas</a> · <a style="color:#ffd35a" href="/">Comprobar otra predicción</a></p>`),
  });
}

// 2) La lista completa de promesas
const nFail = CASES.filter((k) => k.st === "FALLIDA").length;
const nOk = CASES.filter((k) => k.st === "CUMPLIDA").length;
const nNow = CASES.filter((k) => k.st === "EN CURSO").length;
page({
  path: "/promesas",
  image: ogImage("promesas"),
  title: "Quién prometió qué: predicciones cripto con fecha y resultado | Topecripto",
  description: cut(`Predicciones públicas de precios cripto, con fecha, fuente y lo que pasó de verdad: ${nFail} fallidas, ${nOk} cumplidas y ${nNow} en curso.`, 160),
  jsonld: graph([
    {
      "@type": "CollectionPage",
      name: "Quién prometió qué",
      url: SITE + "/promesas",
      inLanguage: "es",
      description: `Registro público de ${CASES.length} predicciones de precios cripto con fecha, fuente y resultado.`,
      publisher: PUBLISHER,
    },
    APP_LD,
  ]),
  body: pre(`<h1 style="color:#fff;margin:0 0 6px">Quién prometió qué</h1><p style="margin:0 0 18px">Predicciones públicas, con fecha, y lo que pasó de verdad: ${nFail} fallidas, ${nOk} cumplidas y ${nNow} en curso.</p>`
    + CASES.map((k) => caseBlock(k, "h2").replace(/<h2 /, `<h2 id="${k.id}" `)).join("\n")
    + navBlock()),
});

// 3) El juego de los ceros
page({
  path: "/ceros",
  image: ogImage("portada"),
  title: "El juego de los ceros: qué pasa si una moneda pierde un cero | Topecripto",
  description: "Quita ceros al precio de una criptomoneda y mira la capitalización de mercado que haría falta. Gratis y con precios en vivo.",
  jsonld: graph([
    {
      "@type": "WebPage",
      name: "El juego de los ceros",
      url: SITE + "/ceros",
      inLanguage: "es",
      description: "Herramienta gratuita que quita ceros al precio de una criptomoneda y enseña la capitalización de mercado que haría falta para que ese precio ocurriera.",
      publisher: PUBLISHER,
    },
    APP_LD,
  ]),
  body: pre(`<h1 style="color:#fff;margin:0 0 6px">El juego de los ceros</h1>
<p style="margin:0 0 10px">La frase "solo tiene que quitarse un cero" suena fácil y casi nunca lo es. Quitar un cero al precio de una moneda significa multiplicar por diez su capitalización de mercado: el precio por el número de monedas en circulación.</p>
<p style="margin:0 0 10px">Aquí eliges una moneda, le quitas ceros al precio y ves, con datos en vivo de CoinGecko, cuánto dinero tendría que valer esa moneda en total y cuántas veces sería el mercado cripto actual.</p>`
    + faqBlock() + navBlock()),
});

// 4) El Indicador Tope
page({
  path: "/indicador",
  image: ogImage("portada"),
  title: "Indicador Tope: hasta dónde suele llegar el precio en 1 día, 1 semana y 1 mes | Topecripto",
  description: "Con el historial real de cada moneda calcula el recorrido habitual y el extremo a 1 día, 1 semana y 1 mes, y cuántas veces de cada cien se alcanzó un precio. Gratis.",
  jsonld: graph([
    {
      "@type": "WebPage",
      name: "Indicador Tope",
      url: SITE + "/indicador",
      inLanguage: "es",
      description: "Herramienta gratuita que mide, con el historial real de cada criptomoneda, hasta dónde llegó el precio como máximo y como mínimo en 1 día, 1 semana y 1 mes, y la frecuencia con la que se alcanzó un precio objetivo.",
      publisher: PUBLISHER,
    },
    APP_LD,
  ]),
  body: pre(`<h1 style="color:#fff;margin:0 0 6px">Indicador Tope</h1>
<p style="margin:0 0 10px">El Indicador Tope mira cada momento de los últimos meses y cuánto llegó a subir y a bajar el precio en el plazo siguiente. Con eso da cuatro cifras por plazo: tope probable, tope extremo, suelo probable y suelo extremo, para 1 día, 1 semana y 1 mes.</p>
<p style="margin:0 0 10px">Si escribes un precio objetivo, además cuenta cuántas veces de cada cien se alcanzó en el pasado y lo traduce en un veredicto: probable, posible, difícil o improbable.</p>
<p style="margin:0 0 10px">Los tres plazos son gratis y no hace falta registrarse ni meter ningún código. Calcula con datos pasados: no predice el futuro ni es asesoramiento financiero.</p>`
    + faqBlock() + navBlock()),
});

// 5) El Detector de tablas
page({
  path: "/pro",
  image: ogImage("portada"),
  title: "Detector de tablas: comprueba la tabla de precios de un influencer | Topecripto",
  description: "Pega una tabla de precios objetivo y marca cuál rompe la aritmética: cuánta capitalización de mercado haría falta para cada cifra. Gratis.",
  jsonld: graph([
    {
      "@type": "WebPage",
      name: "Detector de tablas",
      url: SITE + "/pro",
      inLanguage: "es",
      description: "Herramienta gratuita que analiza una tabla de precios objetivo de criptomonedas y señala qué cifras serían imposibles por capitalización de mercado.",
      publisher: PUBLISHER,
    },
    APP_LD,
  ]),
  body: pre(`<h1 style="color:#fff;margin:0 0 6px">Detector de tablas</h1>
<p style="margin:0 0 10px">Los vídeos y los grupos de Telegram enseñan tablas con precios objetivo que parecen estudiadas. Pega aquí esa tabla y el detector hace la cuenta por cada fila: cuánta capitalización de mercado haría falta y si eso cabe en el mercado que existe.</p>
<p style="margin:0 0 10px">Suele bastar una fila para ver que la tabla entera no se sostiene. Es gratis, no hay registro y no se guarda nada.</p>`
    + faqBlock() + navBlock()),
});

// 6) La portada (se escribe al final: el resto de páginas parten de esta plantilla)
page({
  path: "/",
  image: ogImage("portada"),
  title: "Topecripto · ¿Es posible ese precio? Reality check de predicciones cripto",
  description: "Escribe el precio que te prometen para una criptomoneda y mira cuánto dinero haría falta de verdad. Gratis, sin registro y con precios en vivo.",
  jsonld: graph([
    APP_LD,
    FAQ_LD,
    {
      "@type": "WebSite",
      name: "Topecripto",
      url: SITE,
      inLanguage: "es",
      description: "Reality check de predicciones de precios de criptomonedas basado en capitalización de mercado.",
      publisher: PUBLISHER,
    },
  ]),
  body: pre(`<h1 style="color:#fff;margin:0 0 6px">¿Ese precio que te prometen es posible?</h1>
<p style="margin:0 0 10px">Topecripto coge el precio que alguien promete para una criptomoneda, lo multiplica por las monedas que hay en circulación y te enseña la capitalización de mercado que haría falta. Luego compara esa cifra con lo que vale hoy todo el mercado cripto. En un segundo ves si es posible, agresivo o imposible.</p>
<p style="margin:0 0 10px">Los precios son en vivo, de CoinGecko. Es gratis, no hay registro y no se pide ningún dato.</p>
<h2 style="color:#fff;margin:20px 0 8px">Qué puedes hacer aquí</h2>
<ul style="margin:0 0 10px;padding-left:20px">
<li><strong>Diagnóstico:</strong> escribe un precio y mira la cuenta y el veredicto.</li>
<li><strong>El juego de los ceros:</strong> quita ceros a un precio y ve qué capitalización implica.</li>
<li><strong>Quién prometió qué:</strong> ${CASES.length} predicciones públicas con fecha, fuente y resultado.</li>
<li><strong>Detector de tablas:</strong> pega la tabla de precios de un influencer y marca la que rompe la aritmética.</li>
<li><strong>Indicador Tope:</strong> hasta dónde suele llegar el precio en 1 día, 1 semana y 1 mes.</li>
</ul>`
    + faqBlock() + navBlock()),
});

// 7) sitemap.xml, robots.txt y llms.txt
const urls = ["/", "/ceros", "/promesas", "/indicador", "/pro", ...CASES.map((k) => "/promesas/" + k.id)];
writeFileSync(new URL("sitemap.xml", DIST),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map((u) => `  <url><loc>${SITE}${u === "/" ? "/" : u}</loc></url>`).join("\n")
  + `\n</urlset>\n`);

// Buscadores y asistentes de IA: todos bienvenidos, el contenido es público y gratis
const BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot",
  "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended",
  "Bingbot", "CCBot", "Meta-ExternalAgent", "Amazonbot", "DuckAssistBot", "MistralAI-User", "YouBot"];
writeFileSync(new URL("robots.txt", DIST),
  `User-agent: *\nAllow: /\n\n`
  + BOTS.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n")
  + `\n\nSitemap: ${SITE}/sitemap.xml\n`);

writeFileSync(new URL("llms.txt", DIST),
  `# Topecripto\n\n`
  + `> Herramienta gratuita en español que comprueba si el precio que alguien promete para una criptomoneda es posible. Multiplica ese precio por las monedas en circulación, obtiene la capitalización de mercado que haría falta y la compara con el valor actual de todo el mercado cripto. Datos en vivo de CoinGecko.\n\n`
  + `Gratis, sin registro y sin suscripción. No es asesoramiento financiero: solo aritmética con datos públicos.\n\n`
  + `## Qué ofrece\n\n`
  + `- Diagnóstico de cualquier predicción de precio: ${SITE}/\n`
  + `- El juego de los ceros, qué implica quitar un cero a un precio: ${SITE}/ceros\n`
  + `- Quién prometió qué, ${CASES.length} predicciones públicas con fecha, fuente y resultado (${nFail} fallidas, ${nOk} cumplidas, ${nNow} en curso): ${SITE}/promesas\n`
  + `- Indicador Tope, recorrido habitual y extremo del precio a 1 día, 1 semana y 1 mes: ${SITE}/indicador\n`
  + `- Detector de tablas de precios de influencers: ${SITE}/pro\n\n`
  + `## Preguntas frecuentes\n\n`
  + FAQ.map((f) => `### ${f.q}\n\n${f.a}\n`).join("\n")
  + `\n## Contacto\n\n`
  + `Las dudas se responden por Telegram: https://t.me/topecripto\n`);

console.log(`prerender: portada + ceros + indicador + pro + promesas + ${CASES.length} promesas · sitemap.xml, robots.txt, llms.txt`);
