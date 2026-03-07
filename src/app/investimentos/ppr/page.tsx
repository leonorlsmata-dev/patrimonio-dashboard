"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PPRForm, type PPRFormData } from "@/components/investments/ppr-form";
import { EmptyState } from "@/components/shared/empty-state";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { PiggyBank, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PPR } from "@/types/investment";

const riskLabels: Record<string, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  dinamico: "Dinâmico",
};

export default function PPRPage() {
  const [items, setItems] = useState<PPR[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PPR | null>(null);

  const fetchItems = useCallback(async () => {
    const { data } = await getSupabase()
      .from("ppr")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as PPR[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleSubmit(formData: PPRFormData) {
    const supabase = getSupabase();
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "ppr")
      .single();

    if (!category) throw new Error("Category not found");

    if (editing) {
      const { error } = await supabase
        .from("ppr")
        .update({
          name: formData.name,
          provider: formData.provider,
          invested_amount: formData.invested_amount,
          current_value: formData.current_value,
          risk_profile: formData.risk_profile,
          start_date: formData.start_date,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      if (error) throw error;
      toast.success("PPR atualizado");
    } else {
      const { error } = await supabase.from("ppr").insert({
        category_id: category.id,
        name: formData.name,
        provider: formData.provider,
        invested_amount: formData.invested_amount,
        current_value: formData.current_value,
        risk_profile: formData.risk_profile,
        start_date: formData.start_date,
        notes: formData.notes || null,
      });
      if (error) throw error;
      toast.success("PPR adicionado");
    }

    setEditing(null);
    fetchItems();
  }

  async function handleDelete(id: string) {
    const { error } = await getSupabase().from("ppr").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao eliminar");
      return;
    }
    toast.success("PPR eliminado");
    fetchItems();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="PPR"
          description="Gestão dos teus Planos Poupança Reforma"
        />
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar PPR
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Sem PPR"
          description="Adiciona o teu primeiro PPR."
          action={{ label: "Adicionar PPR", onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const gainLoss = Number(item.current_value) - Number(item.invested_amount);
            const pct = Number(item.invested_amount) > 0
              ? (gainLoss / Number(item.invested_amount)) * 100
              : 0;
            return (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{item.provider}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => { setEditing(item); setFormOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <CurrencyDisplay value={Number(item.current_value)} className="text-2xl font-bold" />
                    <PercentageBadge value={pct} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Investido:</span>
                    <CurrencyDisplay value={Number(item.invested_amount)} className="text-sm font-medium" />
                    {item.risk_profile && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {riskLabels[item.risk_profile] ?? item.risk_profile}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PPRForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editing}
      />
    </div>
  );
}
