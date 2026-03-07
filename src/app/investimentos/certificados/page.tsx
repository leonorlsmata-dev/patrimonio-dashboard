"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  CertificateForm,
  type CertificateFormData,
} from "@/components/investments/certificate-form";
import { EmptyState } from "@/components/shared/empty-state";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { Shield, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CertificadoAforro } from "@/types/investment";

export default function CertificadosPage() {
  const [items, setItems] = useState<CertificadoAforro[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CertificadoAforro | null>(null);

  const fetch = useCallback(async () => {
    const { data } = await getSupabase()
      .from("certificados_aforro")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as CertificadoAforro[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function handleSubmit(formData: CertificateFormData) {
    const supabase = getSupabase();
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "certificado_aforro")
      .single();

    if (!category) throw new Error("Category not found");

    if (editing) {
      const { error } = await supabase
        .from("certificados_aforro")
        .update({
          series: formData.series,
          invested_amount: formData.invested_amount,
          current_value: formData.current_value,
          interest_rate: formData.interest_rate,
          subscription_date: formData.subscription_date,
          maturity_date: formData.maturity_date,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      if (error) throw error;
      toast.success("Certificado atualizado");
    } else {
      const { error } = await supabase.from("certificados_aforro").insert({
        category_id: category.id,
        series: formData.series,
        invested_amount: formData.invested_amount,
        current_value: formData.current_value,
        interest_rate: formData.interest_rate,
        subscription_date: formData.subscription_date,
        maturity_date: formData.maturity_date,
        notes: formData.notes || null,
      });
      if (error) throw error;
      toast.success("Certificado adicionado");
    }

    setEditing(null);
    fetch();
  }

  async function handleDelete(id: string) {
    const { error } = await getSupabase()
      .from("certificados_aforro")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro ao eliminar");
      return;
    }
    toast.success("Certificado eliminado");
    fetch();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Certificados de Aforro"
          description="Gestão dos teus Certificados de Aforro"
        />
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
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
          icon={Shield}
          title="Sem Certificados"
          description="Adiciona o teu primeiro Certificado de Aforro."
          action={{ label: "Adicionar", onClick: () => setFormOpen(true) }}
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
                  <CardTitle className="text-base">{item.series}</CardTitle>
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
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Investido</span>
                      <p className="font-medium"><CurrencyDisplay value={Number(item.invested_amount)} /></p>
                    </div>
                    {item.interest_rate && (
                      <div>
                        <span className="text-muted-foreground">Taxa</span>
                        <p className="font-medium">{Number(item.interest_rate).toFixed(3)}%</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CertificateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editing}
      />
    </div>
  );
}
