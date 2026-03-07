"use client";

import { useState } from "react";
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
import type { PPR } from "@/types/investment";

interface PPRFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PPRFormData) => Promise<void>;
  initialData?: PPR | null;
}

export interface PPRFormData {
  name: string;
  provider: string;
  invested_amount: number;
  current_value: number;
  risk_profile: "conservador" | "moderado" | "dinamico" | null;
  start_date: string;
  notes: string;
}

export function PPRForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: PPRFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [provider, setProvider] = useState(initialData?.provider ?? "");
  const [investedAmount, setInvestedAmount] = useState(
    initialData ? String(initialData.invested_amount) : ""
  );
  const [currentValue, setCurrentValue] = useState(
    initialData ? String(initialData.current_value) : ""
  );
  const [riskProfile, setRiskProfile] = useState<string>(
    initialData?.risk_profile ?? ""
  );
  const [startDate, setStartDate] = useState(initialData?.start_date ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !provider.trim() || !investedAmount || !currentValue || !startDate) {
      setError("Preenche todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        provider: provider.trim(),
        invested_amount: parseFloat(investedAmount),
        current_value: parseFloat(currentValue),
        risk_profile: (riskProfile as PPRFormData["risk_profile"]) || null,
        start_date: startDate,
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
            {initialData ? "Editar PPR" : "Adicionar PPR"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome do PPR"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Entidade *</Label>
              <Input
                id="provider"
                placeholder="Ex: Alves Ribeiro"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investedAmount">Montante Investido (EUR) *</Label>
              <Input
                id="investedAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentValue">Valor Atual (EUR) *</Label>
              <Input
                id="currentValue"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="riskProfile">Perfil de Risco</Label>
              <select
                id="riskProfile"
                value={riskProfile}
                onChange={(e) => setRiskProfile(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Selecionar...</option>
                <option value="conservador">Conservador</option>
                <option value="moderado">Moderado</option>
                <option value="dinamico">Dinâmico</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas opcionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Guardar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
