"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { getSupabase } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ASSET_CATEGORIES } from "@/lib/constants";
import { ArrowLeftRight } from "lucide-react";
import type {
  EtfTransaction,
  EtfPosition,
  CryptoTransaction,
  CryptoPosition,
} from "@/types/investment";

interface TimelineRow {
  id: string;
  date: string;
  type: "buy" | "sell";
  assetName: string;
  assetTicker: string;
  category: "etf" | "crypto";
  categoryColor: string;
  categoryLabel: string;
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  fees: number;
}

const months = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return {
    value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    label: d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
  };
});

export default function TransacoesPage() {
  const [etfTransactions, setEtfTransactions] = useState<EtfTransaction[]>([]);
  const [etfPositions, setEtfPositions] = useState<EtfPosition[]>([]);
  const [cryptoTransactions, setCryptoTransactions] = useState<
    CryptoTransaction[]
  >([]);
  const [cryptoPositions, setCryptoPositions] = useState<CryptoPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterAssetType, setFilterAssetType] = useState<string>("all");
  const [filterTxType, setFilterTxType] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const supabase = getSupabase();

      const [etfTxRes, etfPosRes, cryptoTxRes, cryptoPosRes] =
        await Promise.all([
          supabase
            .from("etf_transactions")
            .select("*")
            .order("transaction_date", { ascending: false }),
          supabase.from("etf_positions").select("*"),
          supabase
            .from("crypto_transactions")
            .select("*")
            .order("transaction_date", { ascending: false }),
          supabase.from("crypto_positions").select("*"),
        ]);

      setEtfTransactions((etfTxRes.data as EtfTransaction[] | null) ?? []);
      setEtfPositions((etfPosRes.data as EtfPosition[] | null) ?? []);
      setCryptoTransactions(
        (cryptoTxRes.data as CryptoTransaction[] | null) ?? []
      );
      setCryptoPositions((cryptoPosRes.data as CryptoPosition[] | null) ?? []);
    } catch {
      setEtfTransactions([]);
      setEtfPositions([]);
      setCryptoTransactions([]);
      setCryptoPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build lookup maps
  const etfPositionMap = useMemo(() => {
    const map = new Map<string, EtfPosition>();
    for (const pos of etfPositions) {
      map.set(pos.id, pos);
    }
    return map;
  }, [etfPositions]);

  const cryptoPositionMap = useMemo(() => {
    const map = new Map<string, CryptoPosition>();
    for (const pos of cryptoPositions) {
      map.set(pos.id, pos);
    }
    return map;
  }, [cryptoPositions]);

  // Merge into unified timeline
  const allRows: TimelineRow[] = useMemo(() => {
    const etfRows: TimelineRow[] = etfTransactions.map((tx) => {
      const pos = etfPositionMap.get(tx.etf_position_id);
      return {
        id: `etf-${tx.id}`,
        date: tx.transaction_date,
        type: tx.type,
        assetName: pos?.name ?? "ETF desconhecido",
        assetTicker: pos?.ticker ?? "???",
        category: "etf" as const,
        categoryColor: ASSET_CATEGORIES.etf.color,
        categoryLabel: ASSET_CATEGORIES.etf.label,
        shares: tx.shares,
        pricePerShare: tx.price_per_share,
        totalAmount: tx.total_amount,
        fees: tx.fees,
      };
    });

    const cryptoRows: TimelineRow[] = cryptoTransactions.map((tx) => {
      const pos = cryptoPositionMap.get(tx.crypto_position_id);
      return {
        id: `crypto-${tx.id}`,
        date: tx.transaction_date,
        type: tx.type,
        assetName: pos?.name ?? "Crypto desconhecido",
        assetTicker: pos?.symbol ?? "???",
        category: "crypto" as const,
        categoryColor: ASSET_CATEGORIES.crypto.color,
        categoryLabel: ASSET_CATEGORIES.crypto.label,
        shares: tx.shares,
        pricePerShare: tx.price_per_share,
        totalAmount: tx.total_amount,
        fees: tx.fees,
      };
    });

    return [...etfRows, ...cryptoRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [etfTransactions, cryptoTransactions, etfPositionMap, cryptoPositionMap]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // Month filter
      if (filterMonth !== "all") {
        const rowMonth = row.date.slice(0, 7); // "YYYY-MM"
        if (rowMonth !== filterMonth) return false;
      }

      // Asset type filter
      if (filterAssetType !== "all") {
        if (
          filterAssetType === "etf" &&
          row.category !== "etf"
        )
          return false;
        if (
          filterAssetType === "crypto" &&
          row.category !== "crypto"
        )
          return false;
      }

      // Transaction type filter
      if (filterTxType !== "all") {
        if (filterTxType === "buy" && row.type !== "buy") return false;
        if (filterTxType === "sell" && row.type !== "sell") return false;
      }

      return true;
    });
  }, [allRows, filterMonth, filterAssetType, filterTxType]);

  // Summary: current month stats
  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const thisMonthRows = allRows.filter(
      (row) => row.date.slice(0, 7) === currentMonth
    );

    const totalInvestedThisMonth = thisMonthRows
      .filter((row) => row.type === "buy")
      .reduce((sum, row) => sum + row.totalAmount, 0);

    const txCountThisMonth = thisMonthRows.length;

    const etfAmountThisMonth = thisMonthRows
      .filter((row) => row.category === "etf" && row.type === "buy")
      .reduce((sum, row) => sum + row.totalAmount, 0);

    const cryptoAmountThisMonth = thisMonthRows
      .filter((row) => row.category === "crypto" && row.type === "buy")
      .reduce((sum, row) => sum + row.totalAmount, 0);

    return {
      totalInvestedThisMonth,
      txCountThisMonth,
      etfAmountThisMonth,
      cryptoAmountThisMonth,
    };
  }, [allRows]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Transacoes"
          description="Historico de todas as tuas transacoes"
        />
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Transacoes"
        description="Historico de todas as tuas transacoes"
      />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investido este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(summary.totalInvestedThisMonth)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transacoes este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.txCountThisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ETFs (compras este mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(summary.etfAmountThisMonth)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Crypto (compras este mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(summary.cryptoAmountThisMonth)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          value={filterMonth}
          onValueChange={(v) => {
            if (v) setFilterMonth(v);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterAssetType}
          onValueChange={(v) => {
            if (v) setFilterAssetType(v);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo de ativo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="etf">ETFs</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterTxType}
          onValueChange={(v) => {
            if (v) setFilterTxType(v);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="buy">Compra</SelectItem>
            <SelectItem value="sell">Venda</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ArrowLeftRight className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">Sem transacoes registadas</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Preco</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Comissoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>
                      {row.type === "buy" ? (
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                          Compra
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Venda</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{row.assetTicker}</span>
                        <span className="text-xs text-muted-foreground">
                          {row.assetName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: row.categoryColor }}
                        />
                        <span className="text-sm">{row.categoryLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.shares.toLocaleString("pt-PT", {
                        maximumFractionDigits: 6,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.category === "crypto" ? (
                        <CurrencyDisplay
                          value={row.pricePerShare}
                          currency="USD"
                        />
                      ) : (
                        formatCurrency(row.pricePerShare)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.category === "crypto" ? (
                        <CurrencyDisplay
                          value={row.totalAmount}
                          currency="USD"
                        />
                      ) : (
                        formatCurrency(row.totalAmount)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.fees > 0 ? formatCurrency(row.fees) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
