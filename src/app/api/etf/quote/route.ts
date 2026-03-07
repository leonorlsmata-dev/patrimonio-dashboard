import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/finance/yahoo";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }
  try {
    const quote = await getQuote(ticker);
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}
