"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CryptoCard } from "@/components/investments/crypto-card";
import {
  CryptoTransactionForm,
  type CryptoTransactionFormData,
} from "@/components/investments/crypto-transaction-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { recalculatePosition } from "@/lib/calculations";
import { Bitcoin, Plus } from "lucide-react";
import { toast } from "sonner";
import type { CryptoPosition, CryptoTransaction } from "@/types/investment";

export default function CryptoPage() {
  const [positions, setPositions] = useState<CryptoPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);

  const fetchPositions = useCallback(async () => {
    try {
      const { data } = await getSupabase()
        .from("crypto_positions")
        .select("*")
        .order("created_at", { ascending: false });
      setPositions((data as CryptoPosition[] | null) ?? []);
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  async function handleTransactionSubmit(formData: CryptoTransactionFormData) {
    const supabase = getSupabase();

    // Get the crypto category ID
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "crypto")
      .single();

    if (!category) {
      throw new Error("Crypto category not found");
    }

    // Check if position exists for this coin_id
    const { data: existing } = await supabase
      .from("crypto_positions")
      .select("id")
      .eq("coin_id", formData.coin_id)
      .maybeSingle();

    let positionId: string;

    if (existing) {
      positionId = (existing as { id: string }).id;
    } else {
      // Create new position with initial zeros
      const { data: newPosition, error: insertError } = await supabase
        .from("crypto_positions")
        .insert({
          category_id: (category as { id: string }).id,
          coin_id: formData.coin_id,
          symbol: formData.symbol,
          name: formData.name,
          shares: 0,
          avg_buy_price: 0,
          total_invested: 0,
          currency: "USD",
          current_price: formData.current_price ?? null,
          current_value: 0,
          notes: null,
        })
        .select("id")
        .single();

      if (insertError || !newPosition) throw insertError;
      positionId = (newPosition as { id: string }).id;
    }

    // Insert the transaction
    const totalAmount =
      formData.shares * formData.price_per_share + formData.fees;

    const { error: txError } = await supabase
      .from("crypto_transactions")
      .insert({
        crypto_position_id: positionId,
        type: formData.type,
        shares: formData.shares,
        price_per_share: formData.price_per_share,
        total_amount: totalAmount,
        fees: formData.fees,
        transaction_date: formData.transaction_date,
        notes: formData.notes || null,
      });

    if (txError) throw txError;

    // Fetch ALL transactions for this position to recalculate
    const { data: allTx } = await supabase
      .from("crypto_transactions")
      .select("*")
      .eq("crypto_position_id", positionId)
      .order("transaction_date", { ascending: true });

    const transactions = (allTx as CryptoTransaction[] | null) ?? [];
    const recalc = recalculatePosition(transactions);

    // Calculate current value
    const priceForValue = formData.current_price ?? recalc.avg_buy_price;
    const currentValue = recalc.shares * priceForValue;

    // Update position with recalculated values
    const { error: updateError } = await supabase
      .from("crypto_positions")
      .update({
        shares: recalc.shares,
        avg_buy_price: recalc.avg_buy_price,
        total_invested: recalc.total_invested,
        current_price: formData.current_price ?? null,
        current_value: currentValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", positionId);

    if (updateError) throw updateError;

    toast.success("Transação registada com sucesso");
    fetchPositions();
  }

  async function handleDelete(id: string) {
    const { error } = await getSupabase()
      .from("crypto_positions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao eliminar crypto");
      return;
    }

    toast.success("Crypto eliminado");
    fetchPositions();
  }

  function handleEdit(position: CryptoPosition) {
    // For now, editing crypto is not supported via a separate form
    // The transaction-based approach handles position updates
    toast.info(`Editar ${position.symbol} - funcionalidade em desenvolvimento`);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Crypto"
          description="Gestão das tuas posições em criptomoedas"
        />
        <Button
          onClick={() => {
            setTransactionFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Registar Compra
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : positions.length === 0 ? (
        <EmptyState
          icon={Bitcoin}
          title="Sem Crypto"
          description="Regista a tua primeira compra de crypto."
          action={{
            label: "Registar Compra",
            onClick: () => setTransactionFormOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((position) => (
            <CryptoCard
              key={position.id}
              position={position}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CryptoTransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        onSubmit={handleTransactionSubmit}
      />
    </div>
  );
}
