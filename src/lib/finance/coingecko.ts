const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export interface CoinQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change24h: number;
  changePercent24h: number;
}

export async function getCoinQuote(coinId: string): Promise<CoinQuote> {
  const res = await fetch(
    `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json();
  const coin = data[coinId];
  if (!coin) throw new Error(`Coin not found: ${coinId}`);

  return {
    id: coinId,
    symbol: coinId,
    name: coinId,
    price: coin.usd ?? 0,
    currency: "USD",
    change24h: 0,
    changePercent24h: coin.usd_24h_change ?? 0,
  };
}

export interface CoinSearchResult {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
}

export async function searchCoin(query: string): Promise<CoinSearchResult[]> {
  const res = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`CoinGecko search error: ${res.status}`);
  const data = await res.json();
  return (data.coins ?? []).slice(0, 10).map((c: { id: string; symbol: string; name: string; thumb: string }) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    thumb: c.thumb,
  }));
}
