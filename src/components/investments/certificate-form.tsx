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
import type { CertificadoAforro } from "@/types/investment";

interface CertificateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CertificateFormData) => Promise<void>;
  initialData?: CertificadoAforro | null;
}

export interface CertificateFormData {
  series: string;
  invested_amount: number;
  current_value: number;
  interest_rate: number | null;
  subscription_date: string;
  maturity_date: string | null;
  notes: string;
}

export function CertificateForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CertificateFormProps) {
  const [series, setSeries] = useState(initialData?.series ?? "");
  const [investedAmount, setInvestedAmount] = useState(
    initialData ? String(initialData.invested_amount) : ""
  );
  const [currentValue, setCurrentValue] = useState(
    initialData ? String(initialData.current_value) : ""
  );
  const [interestRate, setInterestRate] = useState(
    initialData?.interest_rate ? String(initialData.interest_rate) : ""
  );
  const [subscriptionDate, setSubscriptionDate] = useState(
    initialData?.subscription_date ?? ""
  );
  const [maturityDate, setMaturityDate] = useState(
    initialData?.maturity_date ?? ""
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!series.trim() || !investedAmount || !currentValue || !subscriptionDate) {
      setError("Preenche todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        series: series.trim(),
        invested_amount: parseFloat(investedAmount),
        current_value: parseFloat(currentValue),
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        subscription_date: subscriptionDate,
        maturity_date: maturityDate || null,
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
            {initialData ? "Editar Certificado" : "Adicionar Certificado de Aforro"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="series">Série *</Label>
            <Input
              id="series"
              placeholder="Ex: Série F"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
            />
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
              <Label htmlFor="interestRate">Taxa de Juro (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.001"
                placeholder="0.000"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscriptionDate">Data de Subscrição *</Label>
              <Input
                id="subscriptionDate"
                type="date"
                value={subscriptionDate}
                onChange={(e) => setSubscriptionDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maturityDate">Data de Maturidade</Label>
            <Input
              id="maturityDate"
              type="date"
              value={maturityDate}
              onChange={(e) => setMaturityDate(e.target.value)}
            />
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
