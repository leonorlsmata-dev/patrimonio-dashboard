const EXCHANGE_API_BASE = "https://open.er-api.com/v6/latest";

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const res = await fetch(`${EXCHANGE_API_BASE}/${from}`);
  if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
  const data = await res.json();

  if (data.result !== "success") throw new Error("Exchange rate fetch failed");

  const rate = data.rates?.[to];
  if (!rate) throw new Error(`Rate not found for ${from} -> ${to}`);

  return rate;
}
