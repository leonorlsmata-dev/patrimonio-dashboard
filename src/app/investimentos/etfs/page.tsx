"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EtfCard } from "@/components/investments/etf-card";
import { EtfForm, type EtfFormData } from "@/components/investments/etf-form";
import {
  EtfTransactionForm,
  type EtfTransactionFormData,
} from "@/components/investments/etf-transaction-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { recalculatePosition } from "@/lib/calculations";
import { TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";
import type { EtfPosition, EtfTransaction } from "@/types/investment";

export default function EtfsPage() {
  const [positions, setPositions] = useState<EtfPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<EtfPosition | null>(
    null
  );

  const fetchPositions = useCallback(async () => {
    try {
      const { data } = await getSupabase()
        .from("etf_positions")
        .select("*")
        .order("created_at", { ascending: false });
      setPositions((data as EtfPosition[] | null) ?? []);
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  async function handleTransactionSubmit(formData: EtfTransactionFormData) {
    const supabase = getSupabase();

    // Get the ETF category ID
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "etf")
      .single();

    if (!category) {
      throw new Error("ETF category not found");
    }

    // Check if position exists for this ticker
    const { data: existing } = await supabase
      .from("etf_positions")
      .select("id")
      .eq("ticker", formData.ticker)
      .maybeSingle();

    let positionId: string;

    if (existing) {
      positionId = (existing as { id: string }).id;
    } else {
      // Create new position with initial zeros
      const { data: newPosition, error: insertError } = await supabase
        .from("etf_positions")
        .insert({
          category_id: (category as { id: string }).id,
          ticker: formData.ticker,
          name: formData.name,
          broker: formData.broker,
          shares: 0,
          avg_buy_price: 0,
          total_invested: 0,
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
      .from("etf_transactions")
      .insert({
        etf_position_id: positionId,
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
      .from("etf_transactions")
      .select("*")
      .eq("etf_position_id", positionId)
      .order("transaction_date", { ascending: true });

    const transactions = (allTx as EtfTransaction[] | null) ?? [];
    const recalc = recalculatePosition(transactions);

    // Calculate current value
    const priceForValue = formData.current_price ?? recalc.avg_buy_price;
    const currentValue = recalc.shares * priceForValue;

    // Update position with recalculated values
    const { error: updateError } = await supabase
      .from("etf_positions")
      .update({
        shares: recalc.shares,
        avg_buy_price: recalc.avg_buy_price,
        total_invested: recalc.total_invested,
        current_price: formData.current_price ?? null,
        current_value: currentValue,
        broker: formData.broker,
        updated_at: new Date().toISOString(),
      })
      .eq("id", positionId);

    if (updateError) throw updateError;

    toast.success("Transação registada com sucesso");
    fetchPositions();
  }

  async function handleEditSubmit(formData: EtfFormData) {
    if (!editingPosition) return;

    const supabase = getSupabase();
    const totalInvested = formData.shares * formData.avg_buy_price;
    const currentValue = formData.current_price
      ? formData.shares * formData.current_price
      : totalInvested;

    const { error } = await supabase
      .from("etf_positions")
      .update({
        ticker: formData.ticker,
        name: formData.name,
        shares: formData.shares,
        avg_buy_price: formData.avg_buy_price,
        total_invested: totalInvested,
        current_price: formData.current_price ?? null,
        current_value: currentValue,
        broker: formData.broker,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingPosition.id);

    if (error) throw error;
    toast.success("ETF atualizado com sucesso");
    setEditingPosition(null);
    fetchPositions();
  }

  async function handleDelete(id: string) {
    const { error } = await getSupabase()
      .from("etf_positions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao eliminar ETF");
      return;
    }

    toast.success("ETF eliminado");
    fetchPositions();
  }

  function handleEdit(position: EtfPosition) {
    setEditingPosition(position);
    setEditFormOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="ETFs"
          description="Gestão das tuas posições em ETFs"
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
          icon={TrendingUp}
          title="Sem ETFs"
          description="Ainda não adicionaste nenhum ETF. Regista a tua primeira compra para começar a acompanhar."
          action={{
            label: "Registar Compra",
            onClick: () => setTransactionFormOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((position) => (
            <EtfCard
              key={position.id}
              position={position}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <EtfTransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        onSubmit={handleTransactionSubmit}
      />

      <EtfForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        onSubmit={handleEditSubmit}
        initialData={editingPosition}
      />
    </div>
  );
}
