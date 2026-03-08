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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface EtfTransactionFormData {
  ticker: string;
  name: string;
  type: "buy" | "sell";
  shares: number;
  price_per_share: number;
  fees: number;
  transaction_date: string;
  broker: string;
  notes: string;
  current_price?: number;
}

interface EtfTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EtfTransactionFormData) => Promise<void>;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function EtfTransactionForm({
  open,
  onOpenChange,
  onSubmit,
}: EtfTransactionFormProps) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [fees, setFees] = useState("0");
  const [transactionDate, setTransactionDate] = useState(todayISO());
  const [broker, setBroker] = useState("Trade Republic");
  const [notes, setNotes] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset all fields when dialog closes
  useEffect(() => {
    if (!open) {
      setTicker("");
      setName("");
      setType("buy");
      setShares("");
      setPricePerShare("");
      setFees("0");
      setTransactionDate(todayISO());
      setBroker("Trade Republic");
      setNotes("");
      setCurrentPrice(null);
      setError("");
    }
  }, [open]);

  async function handleTickerBlur() {
    if (!ticker.trim()) return;
    setFetchingPrice(true);
    try {
      const res = await fetch(
        `/api/etf/quote?ticker=${encodeURIComponent(ticker.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setCurrentPrice(data.price);
        if (!name) setName(data.name);
        if (!pricePerShare) setPricePerShare(String(data.price));
      }
    } catch {
      // Ignore price fetch errors
    } finally {
      setFetchingPrice(false);
    }
  }

  const totalAmount =
    (parseFloat(shares) || 0) * (parseFloat(pricePerShare) || 0) +
    (parseFloat(fees) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!ticker.trim() || !shares || !pricePerShare) {
      setError("Preenche todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ticker: ticker.trim().toUpperCase(),
        name: name.trim() || ticker.trim().toUpperCase(),
        type,
        shares: parseFloat(shares),
        price_per_share: parseFloat(pricePerShare),
        fees: parseFloat(fees) || 0,
        transaction_date: transactionDate,
        broker: broker.trim(),
        notes: notes.trim(),
        current_price: currentPrice ?? undefined,
      });
      onOpenChange(false);
    } catch {
      setError("Erro ao registar transação. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registar Transação ETF</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tx-ticker">Ticker *</Label>
              <div className="relative">
                <Input
                  id="tx-ticker"
                  placeholder="Ex: VWCE.DE"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  onBlur={handleTickerBlur}
                />
                {fetchingPrice && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-name">Nome</Label>
              <Input
                id="tx-name"
                placeholder="Nome do ETF"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={type}
                onValueChange={(v) => { if (v) setType(v as "buy" | "sell"); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Compra</SelectItem>
                  <SelectItem value="sell">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-shares">Unidades *</Label>
              <Input
                id="tx-shares"
                type="number"
                step="0.000001"
                placeholder="0.0000"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tx-price">Preço/Unidade (EUR) *</Label>
              <Input
                id="tx-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-fees">Comissões (EUR)</Label>
              <Input
                id="tx-fees"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tx-date">Data *</Label>
              <Input
                id="tx-date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-broker">Corretora</Label>
              <Input
                id="tx-broker"
                placeholder="Trade Republic"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
              />
            </div>
          </div>

          {currentPrice !== null && (
            <p className="text-sm text-muted-foreground">
              Preço atual:{" "}
              <span className="font-medium">
                {currentPrice.toFixed(2)} EUR
              </span>
            </p>
          )}

          {totalAmount > 0 && (
            <p className="text-sm font-medium">
              Total: {totalAmount.toFixed(2)} EUR
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="tx-notes">Notas</Label>
            <Textarea
              id="tx-notes"
              placeholder="Notas opcionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Registar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
