"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { Goal } from "@/types/investment";

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GoalFormData) => Promise<void>;
  initialData?: Goal | null;
}

export interface GoalFormData {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  color: string;
  notes: string;
}

const GOAL_COLORS = [
  { label: "Azul", value: "#3B82F6" },
  { label: "Verde", value: "#10B981" },
  { label: "Roxo", value: "#8B5CF6" },
  { label: "Amarelo", value: "#F59E0B" },
  { label: "Rosa", value: "#EC4899" },
  { label: "Laranja", value: "#F97316" },
  { label: "Turquesa", value: "#14B8A6" },
  { label: "Vermelho", value: "#EF4444" },
];

export function GoalForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: GoalFormProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0].value);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setTargetAmount(initialData ? String(initialData.target_amount) : "");
      setCurrentAmount(initialData ? String(initialData.current_amount) : "0");
      setTargetDate(initialData?.target_date ?? "");
      setCategory(initialData?.category ?? "");
      setColor(initialData?.color ?? GOAL_COLORS[0].value);
      setNotes(initialData?.notes ?? "");
      setError("");
    }
  }, [open, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !targetAmount) {
      setError("Preenche o nome e o montante alvo");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        target_date: targetDate || "",
        category: category.trim(),
        color,
        notes: notes.trim(),
      });
      onOpenChange(false);
    } catch {
      setError("Erro ao guardar. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Objetivo" : "Novo Objetivo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nome *</Label>
            <Input
              id="goal-name"
              placeholder="Ex: Fundo de emergência"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-target">Montante Alvo (EUR) *</Label>
              <Input
                id="goal-target"
                type="number"
                step="0.01"
                min="0"
                placeholder="10000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-current">Montante Atual (EUR)</Label>
              <Input
                id="goal-current"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-date">Data Alvo</Label>
              <Input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-category">Categoria</Label>
              <Input
                id="goal-category"
                placeholder="Ex: Poupança, Viagem..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-notes">Notas</Label>
            <Textarea
              id="goal-notes"
              placeholder="Notas opcionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Guardar" : "Criar Objetivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
