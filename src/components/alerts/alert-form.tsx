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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { Alert } from "@/types/investment";

interface AlertFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AlertFormData) => Promise<void>;
  initialData?: Alert | null;
}

export interface AlertFormData {
  type: "price_above" | "price_below" | "goal_milestone" | "portfolio_value";
  target_value: number;
  reference_ticker: string;
  message: string;
}

const ALERT_TYPES = [
  { value: "price_above", label: "Preço acima de" },
  { value: "price_below", label: "Preço abaixo de" },
  { value: "portfolio_value", label: "Valor do portfolio acima de" },
  { value: "goal_milestone", label: "Marco de objetivo" },
] as const;

export function AlertForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: AlertFormProps) {
  const [type, setType] = useState<AlertFormData["type"]>("price_above");
  const [targetValue, setTargetValue] = useState("");
  const [referenceTicker, setReferenceTicker] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isPriceAlert = type === "price_above" || type === "price_below";

  useEffect(() => {
    if (open) {
      setType(initialData?.type ?? "price_above");
      setTargetValue(initialData ? String(initialData.target_value) : "");
      setReferenceTicker(initialData?.reference_ticker ?? "");
      setMessage(initialData?.message ?? "");
      setError("");
    }
  }, [open, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!targetValue) {
      setError("O valor alvo é obrigatório");
      return;
    }

    if (isPriceAlert && !referenceTicker.trim()) {
      setError("O ticker é obrigatório para alertas de preço");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        type,
        target_value: parseFloat(targetValue),
        reference_ticker: referenceTicker.trim().toUpperCase(),
        message: message.trim(),
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
            {initialData ? "Editar Alerta" : "Novo Alerta"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Alerta *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as AlertFormData["type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALERT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isPriceAlert && (
            <div className="space-y-2">
              <Label htmlFor="alert-ticker">Ticker *</Label>
              <Input
                id="alert-ticker"
                placeholder="Ex: VWCE.DE"
                value={referenceTicker}
                onChange={(e) => setReferenceTicker(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="alert-value">
              Valor Alvo (EUR) *
            </Label>
            <Input
              id="alert-value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-message">Mensagem</Label>
            <Textarea
              id="alert-message"
              placeholder="Mensagem opcional para quando o alerta disparar..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Guardar" : "Criar Alerta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
