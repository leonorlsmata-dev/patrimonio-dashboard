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
import type { BankAccount } from "@/types/investment";

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
  initialData?: BankAccount | null;
}

export interface AccountFormData {
  bank_name: string;
  account_type: "corrente" | "poupanca";
  balance: number;
  interest_rate: number;
  notes: string;
}

export function AccountForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: AccountFormProps) {
  const [bankName, setBankName] = useState(initialData?.bank_name ?? "");
  const [accountType, setAccountType] = useState<string>(
    initialData?.account_type ?? "corrente"
  );
  const [balance, setBalance] = useState(
    initialData ? String(initialData.balance) : ""
  );
  const [interestRate, setInterestRate] = useState(
    initialData ? String(initialData.interest_rate) : "0"
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!bankName.trim() || !balance) {
      setError("Preenche todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        bank_name: bankName.trim(),
        account_type: accountType as "corrente" | "poupanca",
        balance: parseFloat(balance),
        interest_rate: parseFloat(interestRate) || 0,
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
            {initialData ? "Editar Conta" : "Adicionar Conta Bancária"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Banco *</Label>
              <Input
                id="bankName"
                placeholder="Ex: CGD, Moey"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountType">Tipo *</Label>
              <select
                id="accountType"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Saldo (EUR) *</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
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
