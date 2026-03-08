"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

const cachedRates: Record<string, number> = {};

export function useExchangeRate(from: string, to: string): number | null {
  const [rate, setRate] = useState<number | null>(
    from === to ? 1 : cachedRates[`${from}_${to}`] ?? null
  );

  useEffect(() => {
    if (from === to) { setRate(1); return; }
    const key = `${from}_${to}`;
    if (cachedRates[key]) { setRate(cachedRates[key]); return; }

    async function fetchRate() {
      try {
        const { data } = await getSupabase()
          .from("exchange_rates")
          .select("rate")
          .eq("from_currency", from)
          .eq("to_currency", to)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          const r = Number((data as { rate: number }).rate);
          cachedRates[key] = r;
          setRate(r);
        }
      } catch {
        // Ignore fetch errors, rate stays null
      }
    }

    fetchRate();
  }, [from, to]);

  return rate;
}
