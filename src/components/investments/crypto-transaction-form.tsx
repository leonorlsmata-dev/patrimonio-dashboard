"use client";

import { useState, useEffect, useRef } from "react";
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

export interface CryptoTransactionFormData {
  coin_id: string;
  symbol: string;
  name: string;
  type: "buy" | "sell";
  shares: number;
  price_per_share: number;
  fees: number;
  transaction_date: string;
  notes: string;
  current_price?: number;
}

interface CryptoTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CryptoTransactionFormData) => Promise<void>;
}

interface CoinResult {
  id: string;
  symbol: string;
  name: string;
  thumb?: string;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function CryptoTransactionForm({
  open,
  onOpenChange,
  onSubmit,
}: CryptoTransactionFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CoinResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinResult | null>(null);
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [fees, setFees] = useState("0");
  const [transactionDate, setTransactionDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Reset all fields when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setShowResults(false);
      setSelectedCoin(null);
      setType("buy");
      setShares("");
      setPricePerShare("");
      setFees("0");
      setTransactionDate(todayISO());
      setNotes("");
      setCurrentPrice(null);
      setError("");
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || selectedCoin) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/crypto/quote?search=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data as CoinResult[]);
          setShowResults(true);
        }
      } catch {
        // Ignore search errors
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, selectedCoin]);

  async function fetchCoinPrice(coinId: string) {
    setFetchingPrice(true);
    try {
      const res = await fetch(
        `/api/crypto/quote?id=${encodeURIComponent(coinId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setCurrentPrice(data.price);
        if (!pricePerShare) setPricePerShare(String(data.price));
      }
    } catch {
      // Ignore price fetch errors
    } finally {
      setFetchingPrice(false);
    }
  }

  function handleSelectCoin(coin: CoinResult) {
    setSelectedCoin(coin);
    setSearchQuery(`${coin.name} (${coin.symbol})`);
    setShowResults(false);
    setSearchResults([]);
    fetchCoinPrice(coin.id);
  }

  function handleClearCoin() {
    setSelectedCoin(null);
    setSearchQuery("");
    setCurrentPrice(null);
    setPricePerShare("");
  }

  const totalAmount =
    (parseFloat(shares) || 0) * (parseFloat(pricePerShare) || 0) +
    (parseFloat(fees) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedCoin) {
      setError("Seleciona uma moeda");
      return;
    }

    if (!shares || !pricePerShare) {
      setError("Preenche todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        coin_id: selectedCoin.id,
        symbol: selectedCoin.symbol,
        name: selectedCoin.name,
        type,
        shares: parseFloat(shares),
        price_per_share: parseFloat(pricePerShare),
        fees: parseFloat(fees) || 0,
        transaction_date: transactionDate,
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
          <DialogTitle>Registar Transação Crypto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crypto-search">Moeda *</Label>
            <div className="relative">
              <Input
                id="crypto-search"
                placeholder="Pesquisar moeda (ex: Bitcoin, Ethereum...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedCoin) handleClearCoin();
                }}
              />
              {(searching || fetchingPrice) && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {showResults && searchResults.length > 0 && (
                <div
                  ref={resultsRef}
                  className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
                >
                  {searchResults.map((coin) => (
                    <button
                      key={coin.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => handleSelectCoin(coin)}
                    >
                      {coin.thumb && (
                        <img
                          src={coin.thumb}
                          alt=""
                          className="h-5 w-5 rounded-full"
                        />
                      )}
                      <span className="font-medium">{coin.symbol}</span>
                      <span className="text-muted-foreground">{coin.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCoin && (
              <p className="text-xs text-muted-foreground">
                Selecionado: {selectedCoin.name} ({selectedCoin.symbol})
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  if (v) setType(v as "buy" | "sell");
                }}
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
              <Label htmlFor="crypto-shares">Unidades *</Label>
              <Input
                id="crypto-shares"
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crypto-price">Preço/Unidade (USD) *</Label>
              <Input
                id="crypto-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crypto-fees">Comissões (USD)</Label>
              <Input
                id="crypto-fees"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crypto-date">Data *</Label>
            <Input
              id="crypto-date"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </div>

          {currentPrice !== null && (
            <p className="text-sm text-muted-foreground">
              Preço atual:{" "}
              <span className="font-medium">
                {currentPrice.toFixed(2)} USD
              </span>
            </p>
          )}

          {totalAmount > 0 && (
            <p className="text-sm font-medium">
              Total: {totalAmount.toFixed(2)} USD
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="crypto-notes">Notas</Label>
            <Textarea
              id="crypto-notes"
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
