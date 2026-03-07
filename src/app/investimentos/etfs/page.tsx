"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EtfCard } from "@/components/investments/etf-card";
import { EtfForm, type EtfFormData } from "@/components/investments/etf-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";
import type { EtfPosition } from "@/types/investment";

export default function EtfsPage() {
  const [positions, setPositions] = useState<EtfPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<EtfPosition | null>(
    null
  );

  const fetchPositions = useCallback(async () => {
    const { data } = await getSupabase()
      .from("etf_positions")
      .select("*")
      .order("created_at", { ascending: false });
    setPositions((data as EtfPosition[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  async function handleSubmit(formData: EtfFormData) {
    const supabase = getSupabase();
    const totalInvested = formData.shares * formData.avg_buy_price;
    const currentValue = formData.current_price
      ? formData.shares * formData.current_price
      : totalInvested;

    // Get the ETF category ID
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "etf")
      .single();

    if (!category) {
      throw new Error("ETF category not found");
    }

    if (editingPosition) {
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
    } else {
      const { error } = await supabase.from("etf_positions").insert({
        category_id: category.id,
        ticker: formData.ticker,
        name: formData.name,
        shares: formData.shares,
        avg_buy_price: formData.avg_buy_price,
        total_invested: totalInvested,
        current_price: formData.current_price ?? null,
        current_value: currentValue,
        broker: formData.broker,
        notes: formData.notes || null,
      });

      if (error) throw error;
      toast.success("ETF adicionado com sucesso");
    }

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
    setFormOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="ETFs"
          description="Gestão das tuas posições em ETFs"
        />
        <Button onClick={() => { setEditingPosition(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar ETF
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
          description="Ainda não adicionaste nenhum ETF. Adiciona o teu primeiro para começar a acompanhar."
          action={{
            label: "Adicionar ETF",
            onClick: () => setFormOpen(true),
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

      <EtfForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingPosition}
      />
    </div>
  );
}
