"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabase } from "@/lib/supabase/client";
import { Wallet } from "lucide-react";
import type {
  EtfPosition,
  CertificadoAforro,
  PPR,
  BankAccount,
  LiquidCash,
  CryptoPosition,
} from "@/types/investment";

interface SummaryData {
  totalValue: number;
  totalInvested: number;
  gainLoss: number;
  gainLossPercent: number;
}

export function PatrimonySummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const [etfs, certificados, pprs, accounts, cash, crypto] = await Promise.all([
          getSupabase().from("etf_positions").select("*"),
          getSupabase().from("certificados_aforro").select("*"),
          getSupabase().from("ppr").select("*"),
          getSupabase().from("bank_accounts").select("*"),
          getSupabase().from("liquid_cash").select("*"),
          getSupabase().from("crypto_positions").select("*"),
        ]);

        let totalInvested = 0;
        let totalValue = 0;

        (etfs.data as EtfPosition[] | null)?.forEach((e) => {
          totalInvested += Number(e.total_invested);
          totalValue += Number(e.current_value ?? e.total_invested);
        });

        (certificados.data as CertificadoAforro[] | null)?.forEach((c) => {
          totalInvested += Number(c.invested_amount);
          totalValue += Number(c.current_value);
        });

        (pprs.data as PPR[] | null)?.forEach((p) => {
          totalInvested += Number(p.invested_amount);
          totalValue += Number(p.current_value);
        });

        (accounts.data as BankAccount[] | null)?.forEach((a) => {
          const bal = Number(a.balance);
          totalInvested += bal;
          totalValue += bal;
        });

        (cash.data as LiquidCash[] | null)?.forEach((c) => {
          const amt = Number(c.amount);
          totalInvested += amt;
          totalValue += amt;
        });

        (crypto.data as CryptoPosition[] | null)?.forEach((c) => {
          totalInvested += Number(c.total_invested);
          totalValue += Number(c.current_value ?? c.total_invested);
        });

        const gainLoss = totalValue - totalInvested;
        const gainLossPercent =
          totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

        setData({ totalValue, totalInvested, gainLoss, gainLossPercent });
      } catch {
        // Suppress error so it doesn't trigger the Next.js error overlay
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-64" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalValue === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Património Total</CardTitle>
            <p className="text-sm text-muted-foreground">
              Adiciona investimentos para ver o resumo
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <CurrencyDisplay
            value={0}
            className="text-4xl font-bold tracking-tight"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">Património Total</CardTitle>
          <p className="text-sm text-muted-foreground">Valor atual de todos os ativos</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CurrencyDisplay
          value={data.totalValue}
          className="text-4xl font-bold tracking-tight"
        />
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Investido: </span>
            <CurrencyDisplay value={data.totalInvested} className="font-medium" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Ganho/Perda: </span>
            <CurrencyDisplay
              value={data.gainLoss}
              className={
                data.gainLoss >= 0
                  ? "font-medium text-emerald-600 dark:text-emerald-400"
                  : "font-medium text-red-600 dark:text-red-400"
              }
            />
            <PercentageBadge value={data.gainLossPercent} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
