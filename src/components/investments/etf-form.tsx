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
import type { EtfPosition } from "@/types/investment";

interface EtfFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EtfFormData) => Promise<void>;
  initialData?: EtfPosition | null;
}

export interface EtfFormData {
  ticker: string;
  name: string;
  shares: number;
  avg_buy_price: number;
  broker: string;
  notes: string;
  current_price?: number;
}

export function EtfForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EtfFormProps) {
  const [ticker, setTicker] = useState(initialData?.ticker ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [shares, setShares] = useState(
    initialData ? String(initialData.shares) : ""
  );
  const [avgBuyPrice, setAvgBuyPrice] = useState(
    initialData ? String(initialData.avg_buy_price) : ""
  );
  const [broker, setBroker] = useState(initialData?.broker ?? "Trade Republic");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [currentPrice, setCurrentPrice] = useState<number | null>(
    initialData?.current_price ?? null
  );
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      }
    } catch {
      // Ignore price fetch errors
    } finally {
      setFetchingPrice(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!ticker.trim() || !name.trim() || !shares || !avgBuyPrice) {
      setError("Preenche todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ticker: ticker.trim().toUpperCase(),
        name: name.trim(),
        shares: parseFloat(shares),
        avg_buy_price: parseFloat(avgBuyPrice),
        broker: broker.trim(),
        notes: notes.trim(),
        current_price: currentPrice ?? undefined,
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
            {initialData ? "Editar ETF" : "Adicionar ETF"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker *</Label>
              <div className="relative">
                <Input
                  id="ticker"
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
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome do ETF"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shares">Unidades *</Label>
              <Input
                id="shares"
                type="number"
                step="0.000001"
                placeholder="0.0000"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgBuyPrice">Preço Médio (EUR) *</Label>
              <Input
                id="avgBuyPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={avgBuyPrice}
                onChange={(e) => setAvgBuyPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="broker">Corretora</Label>
            <Input
              id="broker"
              placeholder="Trade Republic"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
            />
          </div>
          {currentPrice !== null && (
            <p className="text-sm text-muted-foreground">
              Preço atual: <span className="font-medium">{currentPrice.toFixed(2)} EUR</span>
            </p>
          )}
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
