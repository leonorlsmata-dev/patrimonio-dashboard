"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getSupabase } from "@/lib/supabase/client";
import { TAX_RATES } from "@/lib/constants";
import type {
  EtfPosition,
  CertificadoAforro,
  PPR,
} from "@/types/investment";

interface TaxableItem {
  name: string;
  category: string;
  invested: number;
  currentValue: number;
  gain: number;
  taxRate: number;
  estimatedTax: number;
}

export default function ImpostosPage() {
  const [items, setItems] = useState<TaxableItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual calculator state
  const [manualGain, setManualGain] = useState("1000");
  const [manualType, setManualType] = useState("capital_gains");

  const fetchData = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const [etfs, certs, pprs] = await Promise.all([
        supabase.from("etf_positions").select("*"),
        supabase.from("certificados_aforro").select("*"),
        supabase.from("ppr").select("*"),
      ]);

      const taxableItems: TaxableItem[] = [];

      ((etfs.data as EtfPosition[] | null) ?? []).forEach((e) => {
        const inv = Number(e.total_invested);
        const cur = Number(e.current_value ?? e.total_invested);
        const gain = cur - inv;
        taxableItems.push({
          name: `${e.ticker} - ${e.name}`,
          category: "ETF",
          invested: inv,
          currentValue: cur,
          gain,
          taxRate: TAX_RATES.capital_gains,
          estimatedTax: gain > 0 ? gain * TAX_RATES.capital_gains : 0,
        });
      });

      ((certs.data as CertificadoAforro[] | null) ?? []).forEach((c) => {
        const inv = Number(c.invested_amount);
        const cur = Number(c.current_value);
        const gain = cur - inv;
        taxableItems.push({
          name: `Certificado ${c.series}`,
          category: "Certificado de Aforro",
          invested: inv,
          currentValue: cur,
          gain,
          taxRate: TAX_RATES.interest,
          estimatedTax: gain > 0 ? gain * TAX_RATES.interest : 0,
        });
      });

      ((pprs.data as PPR[] | null) ?? []).forEach((p) => {
        const inv = Number(p.invested_amount);
        const cur = Number(p.current_value);
        const gain = cur - inv;
        // Default to the most common PPR rate (8+ years retirement)
        const rate = TAX_RATES.ppr_8_plus_years_retirement;
        taxableItems.push({
          name: p.name,
          category: "PPR",
          invested: inv,
          currentValue: cur,
          gain,
          taxRate: rate,
          estimatedTax: gain > 0 ? gain * rate : 0,
        });
      });

      setItems(taxableItems);
    } catch {
      // Handle the case where the supabase client is not yet fully configured
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalGain = useMemo(
    () => items.reduce((sum, i) => sum + Math.max(i.gain, 0), 0),
    [items]
  );
  const totalTax = useMemo(
    () => items.reduce((sum, i) => sum + i.estimatedTax, 0),
    [items]
  );
  const totalUnrealizedGain = useMemo(
    () => items.reduce((sum, i) => sum + i.gain, 0),
    [items]
  );

  // Manual calculator
  const manualGainValue = parseFloat(manualGain) || 0;
  const manualRate =
    TAX_RATES[manualType as keyof typeof TAX_RATES] ?? TAX_RATES.capital_gains;
  const manualTax = manualGainValue > 0 ? manualGainValue * manualRate : 0;
  const manualNet = manualGainValue - manualTax;

  const TAX_TYPE_LABELS: Record<string, string> = {
    capital_gains: "Mais-valias (28%)",
    interest: "Juros (28%)",
    ppr_8_plus_years_retirement: "PPR 8+ anos — Reforma (8%)",
    ppr_8_plus_years_other: "PPR 8+ anos — Outros (17,2%)",
    ppr_5_to_8_years: "PPR 5-8 anos (21,5%)",
    ppr_under_5_years: "PPR <5 anos (28%)",
  };

  return (
    <div>
      <PageHeader
        title="Impostos"
        description="Estimativas de impostos sobre os teus investimentos"
      />

      <div className="space-y-6">
        {/* Summary cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Mais-valias Não Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CurrencyDisplay
                  value={totalUnrealizedGain}
                  className={`text-2xl font-bold ${
                    totalUnrealizedGain >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Ganhos Tributáveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CurrencyDisplay
                  value={totalGain}
                  className="text-2xl font-bold"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Imposto Estimado Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CurrencyDisplay
                  value={totalTax}
                  className="text-2xl font-bold text-red-600 dark:text-red-400"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Investments tax detail */}
        {!loading && items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Detalhe por Investimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Nome</th>
                      <th className="text-left py-2 font-medium">Categoria</th>
                      <th className="text-right py-2 font-medium">
                        Mais-Valia
                      </th>
                      <th className="text-right py-2 font-medium">Taxa</th>
                      <th className="text-right py-2 font-medium">
                        Imposto Est.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        </td>
                        <td
                          className={`text-right py-2 ${
                            item.gain >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          <CurrencyDisplay value={item.gain} />
                        </td>
                        <td className="text-right py-2">
                          {(item.taxRate * 100).toFixed(1)}%
                        </td>
                        <td className="text-right py-2 font-medium">
                          <CurrencyDisplay value={item.estimatedTax} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td colSpan={4} className="py-2">
                        Total
                      </td>
                      <td className="text-right py-2">
                        <CurrencyDisplay value={totalTax} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Manual calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Calculadora de Impostos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Simula o imposto sobre uma mais-valia específica.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manual-gain">Ganho / Mais-Valia (EUR)</Label>
                <Input
                  id="manual-gain"
                  type="number"
                  min="0"
                  step="100"
                  value={manualGain}
                  onChange={(e) => setManualGain(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Rendimento</Label>
                <Select value={manualType} onValueChange={(v) => { if (v) setManualType(v); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleciona o tipo">
                      {TAX_TYPE_LABELS[manualType] ?? manualType}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TAX_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 mt-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Ganho Bruto
                </p>
                <CurrencyDisplay
                  value={manualGainValue}
                  className="text-lg font-bold"
                />
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Imposto ({(manualRate * 100).toFixed(1)}%)
                </p>
                <CurrencyDisplay
                  value={manualTax}
                  className="text-lg font-bold text-red-600 dark:text-red-400"
                />
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Ganho Líquido
                </p>
                <CurrencyDisplay
                  value={manualNet}
                  className="text-lg font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax rates reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Referência de Taxas (Portugal)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Tipo</th>
                    <th className="text-right py-2 font-medium">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(TAX_TYPE_LABELS).map(([key, label]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2">{label}</td>
                      <td className="text-right py-2 font-medium">
                        {(
                          (TAX_RATES[key as keyof typeof TAX_RATES] ?? 0) * 100
                        ).toFixed(1)}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
