"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabase } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TransactionRow {
  id: string;
  type: "buy" | "sell";
  shares: number;
  price_per_share: number;
  total_amount: number;
  fees: number;
  transaction_date: string;
  notes: string | null;
}

interface TransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positionId: string;
  positionName: string;
  tableName: "etf_transactions" | "crypto_transactions";
  foreignKey: "etf_position_id" | "crypto_position_id";
}

export function TransactionHistory({
  open,
  onOpenChange,
  positionId,
  positionName,
  tableName,
  foreignKey,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function fetchTransactions() {
      setLoading(true);
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .eq(foreignKey, positionId)
          .order("transaction_date", { ascending: false });

        if (error) {
          console.error("Error fetching transactions:", error);
          return;
        }

        setTransactions((data as TransactionRow[] | null) ?? []);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [open, positionId, tableName, foreignKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transações - {positionName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sem transações registadas
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Comissões</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{formatDate(tx.transaction_date)}</TableCell>
                  <TableCell>
                    {tx.type === "buy" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Compra
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Venda
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(tx.shares).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(tx.price_per_share))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(tx.total_amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(tx.fees))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
