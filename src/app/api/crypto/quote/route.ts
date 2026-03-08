import { NextRequest, NextResponse } from "next/server";
import { getCoinQuote, searchCoin } from "@/lib/finance/coingecko";

export async function GET(request: NextRequest) {
  const coinId = request.nextUrl.searchParams.get("id");
  const query = request.nextUrl.searchParams.get("search");

  if (query) {
    try {
      const results = await searchCoin(query);
      return NextResponse.json(results);
    } catch {
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
  }

  if (!coinId) {
    return NextResponse.json({ error: "id or search parameter required" }, { status: 400 });
  }

  try {
    const quote = await getCoinQuote(coinId);
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
