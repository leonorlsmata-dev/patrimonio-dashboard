"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { GoalForm, type GoalFormData } from "@/components/goals/goal-form";
import { GoalCard } from "@/components/goals/goal-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Goal } from "@/types/investment";

export default function ObjetivosPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const { data } = await getSupabase()
        .from("goals")
        .select("*")
        .order("is_completed", { ascending: true })
        .order("created_at", { ascending: false });
      setGoals((data as Goal[] | null) ?? []);
    } catch {
      // Supabase connection may not be configured
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  async function handleSubmit(formData: GoalFormData) {
    const supabase = getSupabase();

    if (editing) {
      const { error } = await supabase
        .from("goals")
        .update({
          name: formData.name,
          target_amount: formData.target_amount,
          current_amount: formData.current_amount,
          target_date: formData.target_date || null,
          category: formData.category || null,
          color: formData.color,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      if (error) throw error;
      toast.success("Objetivo atualizado");
    } else {
      const { error } = await supabase.from("goals").insert({
        name: formData.name,
        target_amount: formData.target_amount,
        current_amount: formData.current_amount,
        target_date: formData.target_date || null,
        category: formData.category || null,
        color: formData.color,
        notes: formData.notes || null,
      });
      if (error) throw error;
      toast.success("Objetivo criado");
    }

    setEditing(null);
    fetchGoals();
  }

  async function handleDelete(id: string) {
    const { error } = await getSupabase()
      .from("goals")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro ao eliminar objetivo");
      return;
    }
    toast.success("Objetivo eliminado");
    fetchGoals();
  }

  async function handleToggleComplete(goal: Goal) {
    const isCompleting = !goal.is_completed;
    const { error } = await getSupabase()
      .from("goals")
      .update({
        is_completed: isCompleting,
        completed_at: isCompleting ? new Date().toISOString() : null,
        current_amount: isCompleting ? goal.target_amount : goal.current_amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal.id);
    if (error) {
      toast.error("Erro ao atualizar objetivo");
      return;
    }
    toast.success(isCompleting ? "Objetivo concluído! 🎉" : "Objetivo reaberto");
    fetchGoals();
  }

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Objetivos"
          description="Define e acompanha os teus objetivos financeiros"
        />
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Objetivo
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sem Objetivos"
          description="Cria o teu primeiro objetivo financeiro para começares a acompanhar o progresso."
          action={{
            label: "Criar Objetivo",
            onClick: () => setFormOpen(true),
          }}
        />
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Ativos ({activeGoals.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={(g) => { setEditing(g); setFormOpen(true); }}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Concluídos ({completedGoals.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={(g) => { setEditing(g); setFormOpen(true); }}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <GoalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editing}
      />
    </div>
  );
}
