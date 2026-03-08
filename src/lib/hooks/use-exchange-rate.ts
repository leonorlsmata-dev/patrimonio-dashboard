"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

const cachedRates: Record<string, number> = {};

export function useExchangeRate(from: string, to: string): number | null {
  const [fetchedRate, setFetchedRate] = useState<number | null>(null);

  useEffect(() => {
    if (from === to) return;
    const key = `${from}_${to}`;
    if (cachedRates[key]) return;

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
          setFetchedRate(r);
        }
      } catch {
        // Ignore fetch errors, rate stays null
      }
    }

    fetchRate();
  }, [from, to]);

  if (from === to) return 1;
  const key = `${from}_${to}`;
  if (cachedRates[key]) return cachedRates[key];
  return fetchedRate;
}
