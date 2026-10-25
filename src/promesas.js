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
//   res     → frase corta con el resultado, para la imagen al compartir
//   extra   → (opcional) una nota que se añade al final
//   src/sn  → enlace a la fuente y nombre del medio
//   src2/sn2 → (opcional) segunda fuente
//
// Orden: fallidas, cumplidas y en curso; dentro de cada grupo, de la más reciente a la más antigua.
// Cuando vence una EN CURSO: cambia st, quita target, escribe p con lo que pasó y actualiza res.

export const ST_COLOR = { FALLIDA: "#ff2d2d", "EN CURSO": "#ffb02e", CUMPLIDA: "#35c759" };

export const CASES = [
  // ---------- FALLIDAS ----------
  {
    id: "bernstein-bitcoin-200000-2025",
    who: "Bernstein", coin: "BTC", claim: "200.000 $ a finales de 2025", st: "FALLIDA",
    p: "Subió su objetivo desde 150.000 $ en junio de 2024. Bitcoin cerró 2025 en unos 88.000 $.",
    res: "Bitcoin cerró 2025 en unos 88.000 $",
    src: "https://www.theblock.co/post/300138/bernstein-bitcoin-price-target-2025", sn: "The Block",
    src2: "https://bitcoinmagazine.com/featured/bitcoin-limps-into-new-year-at-87000", sn2: "Bitcoin Magazine",
  },
  {
    id: "sc-bitcoin-200000-2025",
    who: "Standard Chartered", coin: "BTC", claim: "200.000 $ a finales de 2025", st: "FALLIDA",
    p: "Lo dijo en diciembre de 2024 su jefe de análisis cripto, Geoff Kendrick. Bitcoin cerró 2025 en unos 88.000 $.",
    res: "Bitcoin cerró 2025 en unos 88.000 $",
    src: "https://benzinga.com/markets/cryptocurrency/24/12/42380983/this-analyst-says-bitcoin-could-reach-200k-by-end-of-2025", sn: "Benzinga",
    src2: "https://bitcoinmagazine.com/featured/bitcoin-limps-into-new-year-at-87000", sn2: "Bitcoin Magazine",
  },
  {
    id: "vaneck-bitcoin-180000-2025",
    who: "VanEck", coin: "BTC", claim: "180.000 $ en 2025", st: "FALLIDA",
    p: "Lo publicó en diciembre de 2024. El máximo de Bitcoin en 2025 fue de algo más de 126.000 $, en octubre, y cerró el año en unos 88.000 $.",
    res: "Su máximo en 2025: unos 126.000 $",
    src: "https://benzinga.com/markets/cryptocurrency/24/12/42490266/bitcoin-to-180000-ethereum-over-6000-solana-to-500-vanecks-2025-crypto-predictions", sn: "Benzinga",
  },
  {
    id: "tom-lee-ethereum-15000-2025",
    who: "Tom Lee", coin: "ETH", claim: "7.000 a 15.000 $ a finales de 2025", st: "FALLIDA",
    p: "Lo dijo en agosto de 2025 en el podcast Bankless. Ethereum cerró 2025 en unos 2.970 $; su máximo del año fue 4.954 $, el 24 de agosto.",
    res: "Ethereum cerró 2025 en unos 2.970 $",
    src: "https://benzinga.com/crypto/cryptocurrency/25/08/46907041/tom-lee-ethereum-is-having-a-2017-bitcoin-moment-could-hit-15000-by-end-of-2025", sn: "Benzinga",
    src2: "https://dqydj.com/2025-ethereum-return/", sn2: "DQYDJ",
  },
  {
    id: "sc-ethereum-7500-2025",
    who: "Standard Chartered", coin: "ETH", claim: "7.500 $ a finales de 2025", st: "FALLIDA",
    p: "Subió su objetivo desde 4.000 $ en agosto de 2025. Ethereum cerró 2025 en unos 2.970 $.",
    res: "Ethereum cerró 2025 en unos 2.970 $",
    src: "https://www.theblock.co/post/366734/standard-chartered-analysts-raise-ethereum-year-end-price-target", sn: "The Block",
    src2: "https://dqydj.com/2025-ethereum-return/", sn2: "DQYDJ",
  },
  {
    id: "sc-xrp-5-50-2025",
    who: "Standard Chartered", coin: "XRP", claim: "5,50 $ a finales de 2025", st: "FALLIDA",
    p: "Lo publicó en abril de 2025. XRP cerró 2025 en unos 1,86 $.",
    res: "XRP cerró 2025 en unos 1,86 $",
    src: "https://www.financemagnates.com/trending/why-is-xrp-going-up-standard-chartered-predicts-550-by-end-of-2025/", sn: "Finance Magnates",
    src2: "https://cryptoticker.io/en/crypto-recap-2025/", sn2: "CryptoTicker",
  },
  {
    id: "sc-solana-275-2025",
    who: "Standard Chartered", coin: "SOL", claim: "275 $ a finales de 2025", st: "FALLIDA",
    p: "Lo publicó en mayo de 2025, con Solana en unos 175 $. Cerró 2025 en unos 125 $.",
    res: "Solana cerró 2025 en unos 125 $",
    src: "https://www.fxstreet.com/cryptocurrencies/news/solana-could-hit-275-by-year-end-500-by-2029-end-standard-chartered-202505271229", sn: "FXStreet",
    src2: "https://cryptoticker.io/en/crypto-recap-2025/", sn2: "CryptoTicker",
  },
  {
    id: "draper-bitcoin-120000-2024",
    who: "Tim Draper", coin: "BTC", claim: "120.000 $ a finales de 2024", st: "FALLIDA",
    p: "Lo dijo en noviembre de 2024. El máximo de Bitcoin en 2024 fue de unos 108.000 $, el 17 de diciembre, y cerró el año en unos 93.400 $.",
    res: "Bitcoin cerró 2024 en unos 93.400 $",
    src: "https://www.benzinga.com/markets/cryptocurrency/24/11/42198722/exclusive-tim-draper-predicts-bitcoin-to-reach-120k-by-end-of-2024-250k-in-2025", sn: "Benzinga",
    src2: "https://dqydj.com/2024-bitcoin-return/", sn2: "DQYDJ",
  },
  {
    id: "draper-bitcoin-250000",
    who: "Tim Draper", coin: "BTC", claim: "250.000 $ a finales de 2022", st: "FALLIDA",
    p: "Lo dijo en abril de 2018. Bitcoin cerró 2022 alrededor de 16.500 $, tras la caída de FTX.",
    res: "Bitcoin cerró 2022 en unos 16.500 $",
    src: "https://www.cnbc.com/2018/04/13/tech-investor-tim-draper-predicts-bitcoin-will-reach-250000-by-2022.html", sn: "CNBC",
  },
  {
    id: "planb-bitcoin-135000-2021",
    who: "PlanB", coin: "BTC", claim: "135.000 $ en diciembre de 2021", st: "FALLIDA",
    p: "Su modelo stock-to-flow apuntaba a 98.000 $ en noviembre y 135.000 $ en diciembre de 2021. Bitcoin cerró 2021 en unos 46.300 $.",
    res: "Bitcoin cerró 2021 en unos 46.300 $",
    src: "https://www.fxstreet.com/cryptocurrencies/news/bitcoin-stock-to-flow-model-invalidated-as-btc-closes-2021-below-100-000-202201010939", sn: "FXStreet",
    src2: "https://investing.com/analysis/bitcoin-closes-2021-at-46300-200613326", sn2: "Investing.com",
  },
  {
    id: "mcafee-bitcoin-1-millon",
    who: "John McAfee", coin: "BTC", claim: "1.000.000 $ a finales de 2020", st: "FALLIDA",
    p: "Lo prometió en 2017. Bitcoin cerró 2020 alrededor de 29.000 $. En enero de 2020 él mismo dijo que la cifra era «una treta».",
    res: "Bitcoin cerró 2020 en unos 29.000 $",
    src: "https://www.forbes.com/sites/billybambrough/2020/01/06/one-of-the-biggest-bets-in-bitcoin-revealed-to-be-a-ruse/", sn: "Forbes",
  },
  {
    id: "tom-lee-bitcoin-91000-2020",
    who: "Tom Lee", coin: "BTC", claim: "91.000 $ en marzo de 2020", st: "FALLIDA",
    p: "Lo dijo en marzo de 2018, con Bitcoin en unos 8.500 $. Bitcoin cerró marzo de 2020 por debajo de 6.500 $, en su peor mes desde 2018.",
    res: "Marzo de 2020: por debajo de 6.500 $",
    src: "https://www.coinspeaker.com/2018/03/20/fundstrats-analyst-tom-lee-predicts-bitcoin-price-reach-91000-march-2020/", sn: "Coinspeaker",
    src2: "https://www.bloomberg.com/news/articles/2020-03-31/bitcoin-s-march-plunge-is-worst-since-the-crypto-bubble-burst", sn2: "Bloomberg",
  },

  // ---------- CUMPLIDAS ----------
  {
    id: "bernstein-bitcoin-90000-2024",
    who: "Bernstein", coin: "BTC", claim: "90.000 $ a finales de 2024", st: "CUMPLIDA",
    p: "Subió su objetivo desde 80.000 $ en marzo de 2024. Bitcoin cerró 2024 en unos 93.400 $.",
    res: "Bitcoin cerró 2024 en unos 93.400 $",
    src: "https://cryptodaily.co.uk/2024/03/bernstein-analysts-predict-bitcoin-could-hit-90000-by-year-end", sn: "CryptoDaily",
    src2: "https://dqydj.com/2024-bitcoin-return/", sn2: "DQYDJ",
  },
  {
    id: "sc-bitcoin-100000-2024",
    who: "Standard Chartered", coin: "BTC", claim: "100.000 $ a finales de 2024", st: "CUMPLIDA",
    p: "Lo dijo Geoff Kendrick en abril de 2023, con Bitcoin en unos 27.600 $. Superó los 100.000 $ el 5 de diciembre de 2024 y llegó a unos 108.000 $, aunque cerró el año en unos 93.400 $.",
    res: "Superó los 100.000 $ el 5 de diciembre de 2024",
    src: "https://www.cnbc.com/2023/04/24/bitcoin-btc-price-could-hit-100000-by-end-2024-standard-chartered.html", sn: "CNBC",
    src2: "https://dqydj.com/2024-bitcoin-return/", sn2: "DQYDJ",
  },
  {
    id: "draper-bitcoin-10000-2017",
    who: "Tim Draper", coin: "BTC", claim: "10.000 $ en tres años", st: "CUMPLIDA",
    p: "Lo dijo en septiembre de 2014, con Bitcoin en unos 413 $. Llegó a 10.000 $ en noviembre de 2017.",
    res: "Llegó a 10.000 $ en noviembre de 2017",
    src: "https://benzinga.com/z/22739640", sn: "Benzinga",
  },

  // ---------- EN CURSO ----------
  {
    id: "cryptobull-xrp-27-2026",
    who: "CryptoBull", coin: "XRP", claim: "27 $ a finales de octubre de 2026", st: "EN CURSO", target: 27,
    extra: "Lo dijo en agosto de 2026 este analista con cerca de un millón de seguidores en X, con XRP en unos 1,03 $. Vence el 31 de octubre de 2026.",
    res: "Vence el 31 de octubre de 2026",
    src: "https://finance.yahoo.com/markets/crypto/articles/xrp-price-prediction-analyst-says-125742956.html", sn: "Yahoo Finance",
  },
  {
    id: "sc-bitcoin-300000-2026",
    who: "Standard Chartered", coin: "BTC", claim: "300.000 $ a finales de 2026", st: "EN CURSO", target: 300000,
    extra: "El propio banco lo rebajó a 150.000 $ en diciembre de 2025 y a 100.000 $ en febrero de 2026.",
    res: "El banco ya lo rebajó dos veces: ahora 100.000 $",
    src: "https://www.theblock.co/post/389609/standard-chartered-bitcoin-50000-ether-1400-rebound", sn: "The Block",
  },
  {
    id: "sc-xrp-8-2026",
    who: "Standard Chartered", coin: "XRP", claim: "8 $ a finales de 2026", st: "EN CURSO", target: 8,
    extra: "En febrero de 2026 el propio banco rebajó el objetivo a 2,80 $.",
    res: "El propio banco ya lo rebajó a 2,80 $",
    src: "https://www.financemagnates.com/trending/why-is-xrp-going-up-standard-chartered-predicts-550-by-end-of-2025/", sn: "Finance Magnates",
    src2: "https://finance.yahoo.com/news/standard-chartered-cuts-2026-xrp-133245765.html", sn2: "Yahoo Finance",
  },
  {
    id: "van-code-xrp-500",
    who: "Vincent Van Code", coin: "XRP", claim: "500 $ entre 2032 y 2035", st: "EN CURSO", target: 500,
    res: "¿Posible? Haz la cuenta con el precio de hoy",
    src: "https://www.tradingview.com/news/newsbtc:1d7b67119094b:0-pundit-predicts-when-xrp-price-will-hit-500-and-what-will-drive-the-rally/", sn: "NewsBTC",
  },
];
