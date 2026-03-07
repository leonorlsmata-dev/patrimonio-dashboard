import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getQuote } from "@/lib/finance/yahoo";
import type { EtfPosition } from "@/types/investment";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // 1. Get all ETF positions
  const { data: positions } = await supabase.from("etf_positions").select("*");
  const typedPositions = (positions as EtfPosition[] | null) ?? [];

  if (typedPositions.length === 0) {
    return NextResponse.json({ message: "No positions to update" });
  }

  // 2. Get unique tickers
  const tickers = [...new Set(typedPositions.map((p) => p.ticker))];
  const updatedTickers: string[] = [];
  const errors: string[] = [];

  // 3. Fetch prices and update
  for (const ticker of tickers) {
    try {
      const quote = await getQuote(ticker);

      // Update each position for this ticker
      const tickerPositions = typedPositions.filter((p) => p.ticker === ticker);
      for (const pos of tickerPositions) {
        await supabase
          .from("etf_positions")
          .update({
            current_price: quote.price,
            current_value: Number(pos.shares) * quote.price,
            last_price_update: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", pos.id);
      }

      // Save to price history
      await supabase.from("etf_price_history").upsert({
        ticker,
        price: quote.price,
        currency: quote.currency,
        date: new Date().toISOString().split("T")[0],
      });

      updatedTickers.push(ticker);
    } catch (error) {
      console.error(`Failed to update ${ticker}:`, error);
      errors.push(ticker);
    }
  }

  // 4. Create patrimony snapshot
  const [etfs, certs, pprs, accounts, cashData] = await Promise.all([
    supabase.from("etf_positions").select("current_value, total_invested"),
    supabase.from("certificados_aforro").select("current_value"),
    supabase.from("ppr").select("current_value"),
    supabase.from("bank_accounts").select("balance"),
    supabase.from("liquid_cash").select("amount"),
  ]);

  const etfValue =
    ((etfs.data as Array<{ current_value: number | null; total_invested: number }>) ?? []).reduce(
      (sum, e) => sum + Number(e.current_value ?? e.total_invested),
      0
    );
  const certValue =
    ((certs.data as Array<{ current_value: number }>) ?? []).reduce(
      (sum, c) => sum + Number(c.current_value),
      0
    );
  const pprValue =
    ((pprs.data as Array<{ current_value: number }>) ?? []).reduce(
      (sum, p) => sum + Number(p.current_value),
      0
    );
  const bankValue =
    ((accounts.data as Array<{ balance: number }>) ?? []).reduce(
      (sum, a) => sum + Number(a.balance),
      0
    );
  const cashValue =
    ((cashData.data as Array<{ amount: number }>) ?? []).reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

  const totalValue = etfValue + certValue + pprValue + bankValue + cashValue;

  await supabase.from("patrimony_snapshots").upsert({
    date: new Date().toISOString().split("T")[0],
    total_value: totalValue,
    etf_value: etfValue,
    certificados_value: certValue,
    ppr_value: pprValue,
    bank_value: bankValue,
    cash_value: cashValue,
    trade_republic_cash_value: 0,
  });

  return NextResponse.json({
    message: "Prices updated",
    updated: updatedTickers,
    errors,
    snapshot: { totalValue },
  });
}
