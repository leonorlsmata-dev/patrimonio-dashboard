// eslint-disable-next-line @typescript-eslint/no-require-imports
const yahooFinance = require("yahoo-finance2").default;

interface QuoteResult {
  symbol: string;
  regularMarketPrice?: number;
  currency?: string;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  shortName?: string;
  longName?: string;
}

interface SearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
}

interface SearchResult {
  quotes: SearchQuote[];
}

export async function getQuote(ticker: string) {
  const result: QuoteResult = await yahooFinance.quote(ticker);
  return {
    ticker: result.symbol,
    price: result.regularMarketPrice ?? 0,
    currency: result.currency ?? "EUR",
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    name: result.shortName ?? result.longName ?? ticker,
  };
}

export async function searchTicker(query: string) {
  const result: SearchResult = await yahooFinance.search(query);
  return result.quotes
    .filter(
      (q: SearchQuote) =>
        q.quoteType === "ETF" || q.quoteType === "EQUITY"
    )
    .map((q: SearchQuote) => ({
      ticker: q.symbol,
      name: q.shortname ?? q.longname ?? q.symbol,
      exchange: q.exchange,
    }));
}
