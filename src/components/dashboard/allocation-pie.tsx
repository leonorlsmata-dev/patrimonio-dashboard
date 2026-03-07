"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabase } from "@/lib/supabase/client";
import { ASSET_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type {
  EtfPosition,
  CertificadoAforro,
  PPR,
  BankAccount,
  LiquidCash,
} from "@/types/investment";

interface AllocationData {
  name: string;
  value: number;
  color: string;
}

export function AllocationPie() {
  const [data, setData] = useState<AllocationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllocation() {
      try {
        const [etfs, certificados, pprs, accounts, cash] = await Promise.all([
          getSupabase().from("etf_positions").select("*"),
          getSupabase().from("certificados_aforro").select("*"),
          getSupabase().from("ppr").select("*"),
          getSupabase().from("bank_accounts").select("*"),
          getSupabase().from("liquid_cash").select("*"),
        ]);

        const allocation: AllocationData[] = [];

        const etfTotal =
          (etfs.data as EtfPosition[] | null)?.reduce(
            (sum, e) => sum + Number(e.current_value ?? e.total_invested),
            0
          ) ?? 0;
        if (etfTotal > 0)
          allocation.push({
            name: ASSET_CATEGORIES.etf.label,
            value: etfTotal,
            color: ASSET_CATEGORIES.etf.color,
          });

        const certTotal =
          (certificados.data as CertificadoAforro[] | null)?.reduce(
            (sum, c) => sum + Number(c.current_value),
            0
          ) ?? 0;
        if (certTotal > 0)
          allocation.push({
            name: ASSET_CATEGORIES.certificado_aforro.label,
            value: certTotal,
            color: ASSET_CATEGORIES.certificado_aforro.color,
          });

        const pprTotal =
          (pprs.data as PPR[] | null)?.reduce(
            (sum, p) => sum + Number(p.current_value),
            0
          ) ?? 0;
        if (pprTotal > 0)
          allocation.push({
            name: ASSET_CATEGORIES.ppr.label,
            value: pprTotal,
            color: ASSET_CATEGORIES.ppr.color,
          });

        const accountTotal =
          (accounts.data as BankAccount[] | null)?.reduce(
            (sum, a) => sum + Number(a.balance),
            0
          ) ?? 0;
        if (accountTotal > 0)
          allocation.push({
            name: ASSET_CATEGORIES.conta_bancaria.label,
            value: accountTotal,
            color: ASSET_CATEGORIES.conta_bancaria.color,
          });

        const cashTotal =
          (cash.data as LiquidCash[] | null)?.reduce(
            (sum, c) => sum + Number(c.amount),
            0
          ) ?? 0;
        if (cashTotal > 0)
          allocation.push({
            name: ASSET_CATEGORIES.dinheiro_liquido.label,
            value: cashTotal,
            color: ASSET_CATEGORIES.dinheiro_liquido.color,
          });

        setData(allocation);
      } catch (error) {
        console.error("Error fetching allocation:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllocation();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alocação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Adiciona investimentos para ver a distribuição
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alocação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(item.value)}</span>
                <span className="text-muted-foreground">
                  ({((item.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
