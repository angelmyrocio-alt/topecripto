// Función de servidor (Vercel). La clave de CoinGecko vive aquí, NUNCA en el navegador.
// El frontend solo llama a /api/prices y recibe los datos ya limpios.

const IDS = [
  "bitcoin", "ethereum", "ripple", "solana", "hyperliquid",
  "chainlink", "stellar", "hedera-hashgraph", "dogecoin",
];
const SYM = {
  bitcoin: "BTC", ethereum: "ETH", ripple: "XRP", solana: "SOL",
  hyperliquid: "HYPE", chainlink: "LINK", stellar: "XLM",
  "hedera-hashgraph": "HBAR", dogecoin: "DOGE",
};
// precio "absurdo" de referencia por moneda para el botón de diagnóstico automático
const ABSURD = { BTC: 1000000, ETH: 50000, XRP: 100, SOL: 375, HYPE: 500, LINK: 10, XLM: 3, HBAR: 2, DOGE: 0.3 };

export default async function handler(req, res) {
  const key = process.env.COINGECKO_API_KEY;
  const base = "https://api.coingecko.com/api/v3";
  const headers = { accept: "application/json" };
  if (key) headers["x-cg-demo-api-key"] = key;

  try {
    const [mRes, gRes] = await Promise.all([
      fetch(`${base}/coins/markets?vs_currency=usd&ids=${IDS.join(",")}&per_page=250&sparkline=false`, { headers }),
      fetch(`${base}/global`, { headers }),
    ]);
    if (!mRes.ok || !gRes.ok) throw new Error("coingecko " + mRes.status + "/" + gRes.status);

    const markets = await mRes.json();
    const global = await gRes.json();

    const coins = IDS.map((id) => {
      const c = markets.find((m) => m.id === id);
      if (!c || !c.current_price || !c.circulating_supply) return null;
      return {
        sym: SYM[id],
        name: c.name,
        price: c.current_price,
        supply: c.circulating_supply,
        absurd: ABSURD[SYM[id]],
      };
    }).filter(Boolean);

    const totalCrypto = global?.data?.total_market_cap?.usd;

    // Cache en el borde de Vercel: 1 llamada por minuto sirve a todos los usuarios.
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=180");
    res.status(200).json({ coins, totalCrypto, updated: Date.now() });
  } catch (e) {
    res.status(502).json({ error: "No se pudieron cargar los precios en vivo" });
  }
}
