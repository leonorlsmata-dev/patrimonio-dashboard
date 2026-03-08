"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabase } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Snapshot {
  date: string;
  total_value: number;
}

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export function HistoricalChart() {
  const [data, setData] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        let limit = 90;
        if (timeRange === "1M") limit = 30;
        if (timeRange === "6M") limit = 180;
        if (timeRange === "1Y") limit = 365;
        if (timeRange === "ALL") limit = 10000;

        const { data: snapshots } = await getSupabase()
          .from("patrimony_snapshots")
          .select("date, total_value")
          .order("date", { ascending: false })
          .limit(limit);

        if (snapshots) {
          // Reverta para ficar por ordem cronológica no gráfico (mais antigo -> mais recente)
          setData((snapshots as Snapshot[]).reverse());
        }
      } catch {
        // Ignore fetch errors
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [timeRange]);

  if (loading && data.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculate percentage change if we have at least 2 points
  const firstValue = data.length > 0 ? data[0].total_value : 0;
  const lastValue = data.length > 0 ? data[data.length - 1].total_value : 0;
  const percentChange = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const isPositive = percentChange >= 0;

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>Evolução do Património</CardTitle>
          <div className="flex items-center gap-2">
            <CardDescription>
              {timeRange === "1M" && "Último mês"}
              {timeRange === "3M" && "Últimos 3 meses"}
              {timeRange === "6M" && "Últimos 6 meses"}
              {timeRange === "1Y" && "Último ano"}
              {timeRange === "ALL" && "Histórico completo"}
            </CardDescription>
            {data.length > 1 && (
              <span
                className={`text-sm font-medium ${
                  isPositive ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {isPositive ? "+" : ""}
                {percentChange.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <Select value={timeRange} onValueChange={(v) => { if (v) setTimeRange(v as TimeRange) }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1M">1 Mês</SelectItem>
            <SelectItem value="3M">3 Meses</SelectItem>
            <SelectItem value="6M">6 Meses</SelectItem>
            <SelectItem value="1Y">1 Ano</SelectItem>
            <SelectItem value="ALL">Todo</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ainda não há dados históricos suficientes.
          </div>
        ) : (
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  hide
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="text-sm font-medium mb-1">
                            {new Date(label as string).toLocaleDateString("pt-PT")}
                          </p>
                          <p className="text-sm font-bold text-primary">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
