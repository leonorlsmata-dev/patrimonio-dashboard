"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabase } from "@/lib/supabase/client";
import { ASSET_CATEGORIES } from "@/lib/constants";
import type {
  EtfPosition,
  CertificadoAforro,
  PPR,
  BankAccount,
  LiquidCash,
  CryptoPosition,
} from "@/types/investment";

interface InvestmentRow {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  invested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export default function InvestimentosPage() {
  const [rows, setRows] = useState<InvestmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const [etfs, certs, pprs, accounts, cash, crypto] = await Promise.all([
        supabase.from("etf_positions").select("*"),
        supabase.from("certificados_aforro").select("*"),
        supabase.from("ppr").select("*"),
        supabase.from("bank_accounts").select("*"),
        supabase.from("liquid_cash").select("*"),
        supabase.from("crypto_positions").select("*"),
      ]);

    const allRows: InvestmentRow[] = [];

    ((etfs.data as EtfPosition[] | null) ?? []).forEach((e) => {
      const inv = Number(e.total_invested);
      const cur = Number(e.current_value ?? e.total_invested);
      const gl = cur - inv;
      allRows.push({
        id: e.id,
        name: `${e.ticker} - ${e.name}`,
        category: "etf",
        categoryColor: ASSET_CATEGORIES.etf.color,
        invested: inv,
        currentValue: cur,
        gainLoss: gl,
        gainLossPercent: inv > 0 ? (gl / inv) * 100 : 0,
      });
    });

    ((certs.data as CertificadoAforro[] | null) ?? []).forEach((c) => {
      const inv = Number(c.invested_amount);
      const cur = Number(c.current_value);
      const gl = cur - inv;
      allRows.push({
        id: c.id,
        name: `Certificado ${c.series}`,
        category: "certificado_aforro",
        categoryColor: ASSET_CATEGORIES.certificado_aforro.color,
        invested: inv,
        currentValue: cur,
        gainLoss: gl,
        gainLossPercent: inv > 0 ? (gl / inv) * 100 : 0,
      });
    });

    ((pprs.data as PPR[] | null) ?? []).forEach((p) => {
      const inv = Number(p.invested_amount);
      const cur = Number(p.current_value);
      const gl = cur - inv;
      allRows.push({
        id: p.id,
        name: p.name,
        category: "ppr",
        categoryColor: ASSET_CATEGORIES.ppr.color,
        invested: inv,
        currentValue: cur,
        gainLoss: gl,
        gainLossPercent: inv > 0 ? (gl / inv) * 100 : 0,
      });
    });

    ((accounts.data as BankAccount[] | null) ?? []).forEach((a) => {
      const bal = Number(a.balance);
      allRows.push({
        id: a.id,
        name: a.bank_name,
        category: "conta_bancaria",
        categoryColor: ASSET_CATEGORIES.conta_bancaria.color,
        invested: bal,
        currentValue: bal,
        gainLoss: 0,
        gainLossPercent: 0,
      });
    });

    ((cash.data as LiquidCash[] | null) ?? []).forEach((c) => {
      const amt = Number(c.amount);
      allRows.push({
        id: c.id,
        name: c.description,
        category: "dinheiro_liquido",
        categoryColor: ASSET_CATEGORIES.dinheiro_liquido.color,
        invested: amt,
        currentValue: amt,
        gainLoss: 0,
        gainLossPercent: 0,
      });
    });

    ((crypto.data as CryptoPosition[] | null) ?? []).forEach((c) => {
      const inv = Number(c.total_invested);
      const cur = Number(c.current_value ?? c.total_invested);
      const gl = cur - inv;
      allRows.push({
        id: c.id,
        name: `${c.symbol} - ${c.name}`,
        category: "crypto",
        categoryColor: ASSET_CATEGORIES.crypto.color,
        invested: inv,
        currentValue: cur,
        gainLoss: gl,
        gainLossPercent: inv > 0 ? (gl / inv) * 100 : 0,
      });
    });

    setRows(allRows);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const categoryTotals = Object.entries(ASSET_CATEGORIES).map(([key, cat]) => {
    const catRows = rows.filter((r) => r.category === key);
    return {
      key,
      label: cat.label,
      color: cat.color,
      total: catRows.reduce((sum, r) => sum + r.currentValue, 0),
      count: catRows.length,
    };
  });

  function renderTable(filteredRows: InvestmentRow[]) {
    if (filteredRows.length === 0) {
      return (
        <p className="text-center text-sm text-muted-foreground py-8">
          Sem investimentos nesta categoria
        </p>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Investido</TableHead>
            <TableHead className="text-right">Valor Atual</TableHead>
            <TableHead className="text-right">Ganho/Perda</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.categoryColor }}
                  />
                  {ASSET_CATEGORIES[row.category as keyof typeof ASSET_CATEGORIES]?.label}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <CurrencyDisplay value={row.invested} />
              </TableCell>
              <TableCell className="text-right">
                <CurrencyDisplay value={row.currentValue} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <CurrencyDisplay
                    value={row.gainLoss}
                    className={
                      row.gainLoss > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : row.gainLoss < 0
                          ? "text-red-600 dark:text-red-400"
                          : ""
                    }
                  />
                  {row.gainLossPercent !== 0 && (
                    <PercentageBadge value={row.gainLossPercent} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div>
      <PageHeader
        title="Investimentos"
        description="Visão geral de todos os teus investimentos"
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categoryTotals.map((cat) => (
              <Card key={cat.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {cat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CurrencyDisplay
                    value={cat.total}
                    className="text-lg font-bold"
                  />
                  <p className="text-xs text-muted-foreground">
                    {cat.count} {cat.count === 1 ? "item" : "itens"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="todos">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="etf">ETFs</TabsTrigger>
              <TabsTrigger value="certificado_aforro">Certificados</TabsTrigger>
              <TabsTrigger value="ppr">PPR</TabsTrigger>
              <TabsTrigger value="conta_bancaria">Contas</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
            </TabsList>
            <TabsContent value="todos">{renderTable(rows)}</TabsContent>
            <TabsContent value="etf">
              {renderTable(rows.filter((r) => r.category === "etf"))}
            </TabsContent>
            <TabsContent value="certificado_aforro">
              {renderTable(rows.filter((r) => r.category === "certificado_aforro"))}
            </TabsContent>
            <TabsContent value="ppr">
              {renderTable(rows.filter((r) => r.category === "ppr"))}
            </TabsContent>
            <TabsContent value="conta_bancaria">
              {renderTable(
                rows.filter(
                  (r) =>
                    r.category === "conta_bancaria" ||
                    r.category === "dinheiro_liquido"
                )
              )}
            </TabsContent>
            <TabsContent value="crypto">
              {renderTable(rows.filter((r) => r.category === "crypto"))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
