"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ProjectionPoint {
  year: number;
  label: string;
  totalWithContributions: number;
  totalWithoutContributions: number;
  contributions: number;
  interest: number;
}

function calculateProjection(
  initialCapital: number,
  monthlyContribution: number,
  annualReturn: number,
  years: number
): ProjectionPoint[] {
  const monthlyRate = annualReturn / 100 / 12;
  const points: ProjectionPoint[] = [];

  let balanceWithContributions = initialCapital;
  let balanceWithoutContributions = initialCapital;
  let totalContributions = initialCapital;

  // Year 0
  points.push({
    year: 0,
    label: "Hoje",
    totalWithContributions: initialCapital,
    totalWithoutContributions: initialCapital,
    contributions: initialCapital,
    interest: 0,
  });

  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      balanceWithContributions =
        balanceWithContributions * (1 + monthlyRate) + monthlyContribution;
      balanceWithoutContributions =
        balanceWithoutContributions * (1 + monthlyRate);
      totalContributions += monthlyContribution;
    }

    points.push({
      year,
      label: `Ano ${year}`,
      totalWithContributions: Math.round(balanceWithContributions * 100) / 100,
      totalWithoutContributions:
        Math.round(balanceWithoutContributions * 100) / 100,
      contributions: Math.round(totalContributions * 100) / 100,
      interest:
        Math.round(
          (balanceWithContributions - totalContributions) * 100
        ) / 100,
    });
  }

  return points;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function ProjecoesPage() {
  const [initialCapital, setInitialCapital] = useState("5000");
  const [monthlyContribution, setMonthlyContribution] = useState("200");
  const [annualReturn, setAnnualReturn] = useState("7");
  const [years, setYears] = useState("20");

  const data = useMemo(() => {
    const cap = parseFloat(initialCapital) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const ret = parseFloat(annualReturn) || 0;
    const yrs = Math.min(Math.max(parseInt(years) || 1, 1), 50);
    return calculateProjection(cap, monthly, ret, yrs);
  }, [initialCapital, monthlyContribution, annualReturn, years]);

  const finalPoint = data[data.length - 1];
  const totalContributed = finalPoint?.contributions ?? 0;
  const finalValue = finalPoint?.totalWithContributions ?? 0;
  const totalInterest = finalPoint?.interest ?? 0;

  return (
    <div>
      <PageHeader
        title="Projeções"
        description="Simulações e projeções do crescimento do teu património"
      />

      <div className="space-y-6">
        {/* Input parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parâmetros da Simulação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="initial-capital">Capital Inicial (EUR)</Label>
                <Input
                  id="initial-capital"
                  type="number"
                  min="0"
                  step="100"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly">Contribuição Mensal (EUR)</Label>
                <Input
                  id="monthly"
                  type="number"
                  min="0"
                  step="50"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="return">Retorno Anual (%)</Label>
                <Input
                  id="return"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Horizonte (anos)</Label>
                <Input
                  id="years"
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Valor Final Projetado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CurrencyDisplay
                value={finalValue}
                className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Contribuído
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CurrencyDisplay
                value={totalContributed}
                className="text-2xl font-bold"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Juros Compostos Gerados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CurrencyDisplay
                value={totalInterest}
                className="text-2xl font-bold text-blue-600 dark:text-blue-400"
              />
              {totalContributed > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalInterest / totalContributed) * 100).toFixed(1)}% de
                  retorno sobre contribuições
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projeção de Crescimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorTotal"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#10B981"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#10B981"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorContributions"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3B82F6"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3B82F6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="label"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `${(value / 1000).toFixed(0)}k€`
                        : `${value}€`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="totalWithContributions"
                    name="Com contribuições"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="contributions"
                    name="Contribuições"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorContributions)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Data table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes por Ano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Ano</th>
                    <th className="text-right py-2 font-medium">
                      Contribuições
                    </th>
                    <th className="text-right py-2 font-medium">Juros</th>
                    <th className="text-right py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((point) => (
                    <tr key={point.year} className="border-b last:border-0">
                      <td className="py-2">{point.label}</td>
                      <td className="text-right py-2">
                        <CurrencyDisplay value={point.contributions} />
                      </td>
                      <td className="text-right py-2 text-blue-600 dark:text-blue-400">
                        <CurrencyDisplay value={point.interest} />
                      </td>
                      <td className="text-right py-2 font-medium">
                        <CurrencyDisplay
                          value={point.totalWithContributions}
                        />
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
