// ===== QUIÉN PROMETIÓ QUÉ =====
// Cada caso es una predicción pública, con fecha y fuente. Solo hechos verificables.
// Para añadir uno: copia un bloque, cambia los datos y haz push.
//
//   id      → la dirección del caso (topecripto.com/promesas/<id>). Minúsculas y guiones, sin tildes. No lo cambies una vez publicado.
//   who     → quién lo dijo
//   coin    → símbolo de la moneda (tiene que existir en la app para el cálculo en vivo)
//   claim   → la promesa, corta
//   st      → "FALLIDA", "CUMPLIDA" o "EN CURSO"
//   p       → qué pasó de verdad (para las EN CURSO se calcula solo con el precio de hoy)
//   target  → solo en EN CURSO: el precio prometido, para hacer la cuenta en vivo
//   src/sn  → enlace a la fuente y nombre del medio

export const ST_COLOR = { FALLIDA: "#ff2d2d", "EN CURSO": "#ffb02e", CUMPLIDA: "#35c759" };

export const CASES = [
  {
    id: "mcafee-bitcoin-1-millon",
    who: "John McAfee", coin: "BTC", claim: "1.000.000 $ a finales de 2020", st: "FALLIDA",
    p: "Lo prometió en 2017. Bitcoin cerró 2020 alrededor de 29.000 $. En enero de 2020 él mismo dijo que la cifra era «una treta».",
    src: "https://www.forbes.com/sites/billybambrough/2020/01/06/one-of-the-biggest-bets-in-bitcoin-revealed-to-be-a-ruse/", sn: "Forbes",
  },
  {
    id: "draper-bitcoin-250000",
    who: "Tim Draper", coin: "BTC", claim: "250.000 $ a finales de 2022", st: "FALLIDA",
    p: "Lo dijo en abril de 2018. Bitcoin cerró 2022 alrededor de 16.500 $, tras la caída de FTX.",
    src: "https://www.cnbc.com/2018/04/13/tech-investor-tim-draper-predicts-bitcoin-will-reach-250000-by-2022.html", sn: "CNBC",
  },
  {
    id: "van-code-xrp-500",
    who: "Vincent Van Code", coin: "XRP", claim: "500 $ entre 2032 y 2035", st: "EN CURSO", target: 500,
    src: "https://www.tradingview.com/news/newsbtc:1d7b67119094b:0-pundit-predicts-when-xrp-price-will-hit-500-and-what-will-drive-the-rally/", sn: "NewsBTC",
  },
];
