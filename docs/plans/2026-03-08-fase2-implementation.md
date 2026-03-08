# Fase 2 Implementation Plan: Transactions, Crypto, Multi-currency, Timeline

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add transaction-based ETF tracking, crypto support with CoinGecko prices, multi-currency (EUR/USD) conversion, and a global transaction timeline.

**Architecture:** Extend existing Supabase tables (etf_transactions already exists) and add new tables (crypto_positions, crypto_transactions, exchange_rates). New API routes for CoinGecko quotes and exchange rates. Refactor ETF flow from position-first to transaction-first. All values converted to EUR for dashboard totals.

**Tech Stack:** Next.js 16, Supabase, yahoo-finance2 v3 (require), CoinGecko free API, exchangerate-api.com, Recharts, shadcn/ui (base-ui version — NO asChild, use render prop or buttonVariants+Link), Tailwind CSS 4.

**Key patterns (MUST follow):**
- Supabase client: use `getSupabase()` from `@/lib/supabase/client` (lazy init)
- Supabase `.select("*")` returns `{}` type — always cast: `(data as TypeName[] | null) ?? []`
- Server routes: use `createServerClient()` from `@/lib/supabase/server`
- yahoo-finance2: `const yahooFinance = require("yahoo-finance2").default` (NOT ES import)
- Each Database table needs `Relationships: []` in types.ts
- Portuguese UI language throughout
- buttonVariants + Link for nav buttons (no asChild)

---

## Task 1: Database Migration — Crypto tables + Exchange rates

**Files:**
- Create: `supabase/migrations/002_crypto_and_exchange_rates.sql`

**Step 1: Write the migration SQL**

```sql
-- ============================================
-- Migration 002: Crypto + Exchange Rates
-- ============================================

-- 1. Crypto positions
CREATE TABLE crypto_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) NOT NULL,
    coin_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    shares DECIMAL(18,8) NOT NULL,
    avg_buy_price DECIMAL(12,4) NOT NULL,
    total_invested DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    current_price DECIMAL(12,4),
    current_value DECIMAL(12,2),
    last_price_update TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crypto transactions
CREATE TABLE crypto_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crypto_position_id UUID REFERENCES crypto_positions(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    shares DECIMAL(18,8) NOT NULL,
    price_per_share DECIMAL(12,4) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    fees DECIMAL(8,2) DEFAULT 0.00,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Exchange rates
CREATE TABLE exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_currency, to_currency, date)
);

CREATE INDEX idx_exchange_rates_lookup ON exchange_rates(from_currency, to_currency, date DESC);

-- 4. Add crypto category
INSERT INTO categories (name, display_name, icon, color, tax_rate, sort_order)
VALUES ('crypto', 'Crypto', 'Bitcoin', '#F7931A', 28.00, 7);

-- 5. Add crypto_value to patrimony_snapshots
ALTER TABLE patrimony_snapshots ADD COLUMN crypto_value DECIMAL(12,2) DEFAULT 0;

-- 6. RLS
ALTER TABLE crypto_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON crypto_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON crypto_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON exchange_rates FOR ALL USING (true) WITH CHECK (true);
```

**Step 2: Run migration on Supabase**

Go to Supabase Dashboard > SQL Editor > paste and run the migration.

**Step 3: Commit**

```bash
git add supabase/migrations/002_crypto_and_exchange_rates.sql
git commit -m "feat: add crypto tables, exchange rates, and crypto category"
```

---

## Task 2: Update TypeScript types for new tables

**Files:**
- Modify: `src/lib/supabase/types.ts`
- Modify: `src/types/investment.ts`

**Step 1: Add new table types to Database interface**

In `src/lib/supabase/types.ts`, add these tables inside `Tables: { ... }` after the `alerts` table:

```typescript
      crypto_positions: {
        Row: {
          id: string;
          category_id: string;
          coin_id: string;
          symbol: string;
          name: string;
          shares: number;
          avg_buy_price: number;
          total_invested: number;
          currency: string;
          current_price: number | null;
          current_value: number | null;
          last_price_update: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          coin_id: string;
          symbol: string;
          name: string;
          shares: number;
          avg_buy_price: number;
          total_invested: number;
          currency?: string;
          current_price?: number | null;
          current_value?: number | null;
          last_price_update?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          coin_id?: string;
          symbol?: string;
          name?: string;
          shares?: number;
          avg_buy_price?: number;
          total_invested?: number;
          currency?: string;
          current_price?: number | null;
          current_value?: number | null;
          last_price_update?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crypto_transactions: {
        Row: {
          id: string;
          crypto_position_id: string;
          type: "buy" | "sell";
          shares: number;
          price_per_share: number;
          total_amount: number;
          fees: number;
          transaction_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          crypto_position_id: string;
          type: "buy" | "sell";
          shares: number;
          price_per_share: number;
          total_amount: number;
          fees?: number;
          transaction_date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          crypto_position_id?: string;
          type?: "buy" | "sell";
          shares?: number;
          price_per_share?: number;
          total_amount?: number;
          fees?: number;
          transaction_date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          id: string;
          from_currency: string;
          to_currency: string;
          rate: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_currency: string;
          to_currency: string;
          rate: number;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_currency?: string;
          to_currency?: string;
          rate?: number;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
```

Also add `crypto_value` to `patrimony_snapshots` Row/Insert/Update types:
- Row: `crypto_value: number;`
- Insert: `crypto_value?: number;`
- Update: `crypto_value?: number;`

**Step 2: Export new types in investment.ts**

Add to `src/types/investment.ts`:

```typescript
export type CryptoPosition = Database["public"]["Tables"]["crypto_positions"]["Row"];
export type CryptoTransaction = Database["public"]["Tables"]["crypto_transactions"]["Row"];
export type ExchangeRate = Database["public"]["Tables"]["exchange_rates"]["Row"];
```

**Step 3: Update constants**

In `src/lib/constants.ts`, add to `ASSET_CATEGORIES`:

```typescript
  crypto: { label: "Crypto", color: "#F7931A", icon: "Bitcoin" },
```

Add to `NAV_ITEMS` (after the ETFs entry):

```typescript
  { href: "/investimentos/crypto", label: "Crypto", icon: "Bitcoin" },
```

And add to `NAV_ITEMS` (before Objetivos):

```typescript
  { href: "/transacoes", label: "Transações", icon: "ArrowLeftRight" },
```

**Step 4: Update sidebar iconMap**

In `src/components/layout/sidebar.tsx`, add imports:

```typescript
import { Bitcoin, ArrowLeftRight } from "lucide-react";
```

And add to `iconMap`:

```typescript
  Bitcoin,
  ArrowLeftRight,
```

**Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/lib/supabase/types.ts src/types/investment.ts src/lib/constants.ts src/components/layout/sidebar.tsx
git commit -m "feat: add crypto and exchange rate types, update constants and navigation"
```

---

## Task 3: CoinGecko API + Exchange Rate API

**Files:**
- Create: `src/lib/finance/coingecko.ts`
- Create: `src/lib/finance/exchange-rate.ts`
- Create: `src/app/api/crypto/quote/route.ts`

**Step 1: Create CoinGecko wrapper**

Create `src/lib/finance/coingecko.ts`:

```typescript
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export interface CoinQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change24h: number;
  changePercent24h: number;
}

export async function getCoinQuote(coinId: string): Promise<CoinQuote> {
  const res = await fetch(
    `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json();
  const coin = data[coinId];
  if (!coin) throw new Error(`Coin not found: ${coinId}`);

  return {
    id: coinId,
    symbol: coinId,
    name: coinId,
    price: coin.usd ?? 0,
    currency: "USD",
    change24h: 0,
    changePercent24h: coin.usd_24h_change ?? 0,
  };
}

export interface CoinSearchResult {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
}

export async function searchCoin(query: string): Promise<CoinSearchResult[]> {
  const res = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`CoinGecko search error: ${res.status}`);
  const data = await res.json();
  return (data.coins ?? []).slice(0, 10).map((c: { id: string; symbol: string; name: string; thumb: string }) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    thumb: c.thumb,
  }));
}
```

**Step 2: Create exchange rate helper**

Create `src/lib/finance/exchange-rate.ts`:

```typescript
const EXCHANGE_API_BASE = "https://open.er-api.com/v6/latest";

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const res = await fetch(`${EXCHANGE_API_BASE}/${from}`);
  if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
  const data = await res.json();

  if (data.result !== "success") throw new Error("Exchange rate fetch failed");

  const rate = data.rates?.[to];
  if (!rate) throw new Error(`Rate not found for ${from} -> ${to}`);

  return rate;
}
```

**Step 3: Create crypto quote API route**

Create `src/app/api/crypto/quote/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCoinQuote, searchCoin } from "@/lib/finance/coingecko";

export async function GET(request: NextRequest) {
  const coinId = request.nextUrl.searchParams.get("id");
  const query = request.nextUrl.searchParams.get("search");

  if (query) {
    try {
      const results = await searchCoin(query);
      return NextResponse.json(results);
    } catch {
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
  }

  if (!coinId) {
    return NextResponse.json({ error: "id or search parameter required" }, { status: 400 });
  }

  try {
    const quote = await getCoinQuote(coinId);
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
```

**Step 4: Verify build**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/lib/finance/coingecko.ts src/lib/finance/exchange-rate.ts src/app/api/crypto/quote/route.ts
git commit -m "feat: add CoinGecko and exchange rate API integrations"
```

---

## Task 4: ETF Transaction Form + Recalculation Logic

**Files:**
- Create: `src/components/investments/etf-transaction-form.tsx`
- Create: `src/lib/calculations.ts`
- Modify: `src/app/investimentos/etfs/page.tsx`

**Step 1: Create calculation helpers**

Create `src/lib/calculations.ts`:

```typescript
import type { EtfTransaction, CryptoTransaction } from "@/types/investment";

export function recalculatePosition(transactions: (EtfTransaction | CryptoTransaction)[]) {
  let totalShares = 0;
  let totalCost = 0;
  let totalFees = 0;

  for (const tx of transactions) {
    if (tx.type === "buy") {
      totalShares += Number(tx.shares);
      totalCost += Number(tx.shares) * Number(tx.price_per_share);
      totalFees += Number(tx.fees);
    } else {
      totalShares -= Number(tx.shares);
    }
  }

  const avgBuyPrice = totalShares > 0 ? totalCost / totalShares : 0;
  const totalInvested = totalCost + totalFees;

  return {
    shares: totalShares,
    avg_buy_price: avgBuyPrice,
    total_invested: totalInvested,
  };
}
```

**Step 2: Create ETF transaction form**

Create `src/components/investments/etf-transaction-form.tsx`:

```typescript
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
  existingTickers?: string[];
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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [broker, setBroker] = useState("Trade Republic");
  const [notes, setNotes] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setTicker("");
    setName("");
    setType("buy");
    setShares("");
    setPricePerShare("");
    setFees("0");
    setDate(new Date().toISOString().split("T")[0]);
    setBroker("Trade Republic");
    setNotes("");
    setCurrentPrice(null);
    setError("");
  }

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
      // Ignore
    } finally {
      setFetchingPrice(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!ticker.trim() || !shares || !pricePerShare) {
      setError("Preenche ticker, unidades e preço");
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
        transaction_date: date,
        broker: broker.trim(),
        notes: notes.trim(),
        current_price: currentPrice ?? undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      setError("Erro ao guardar. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalAmount =
    shares && pricePerShare
      ? (parseFloat(shares) * parseFloat(pricePerShare)).toFixed(2)
      : "0.00";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
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
              <Label htmlFor="tx-type">Tipo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as "buy" | "sell")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Compra</SelectItem>
                  <SelectItem value="sell">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="tx-price">Preço por unidade *</Label>
              <Input
                id="tx-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tx-fees">Comissões</Label>
              <Input
                id="tx-fees"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-date">Data *</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
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
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-medium">{totalAmount} EUR</span>
            {currentPrice !== null && (
              <> | Preço atual: <span className="font-medium">{currentPrice.toFixed(2)} EUR</span></>
            )}
          </p>
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
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Refactor ETFs page to use transactions**

Replace `src/app/investimentos/etfs/page.tsx` with transaction-based flow. The page should:

1. Keep the existing card grid for positions
2. Replace "Adicionar ETF" button with "Registar Compra"
3. On form submit:
   - Check if etf_position exists for this ticker
   - If not, create position + transaction
   - If yes, add transaction + recalculate position
4. Keep edit position (for notes/broker) and delete
5. Add "Ver Transações" button on each card that shows transaction history in a dialog

The full page code is large — implement following the existing patterns in the current `etfs/page.tsx`.

**Key logic for handleTransactionSubmit:**

```typescript
async function handleTransactionSubmit(formData: EtfTransactionFormData) {
  const supabase = getSupabase();

  // Get category
  const { data: category } = await supabase
    .from("categories").select("id").eq("name", "etf").single();
  if (!category) throw new Error("ETF category not found");

  // Check if position exists for this ticker
  const { data: existing } = await supabase
    .from("etf_positions")
    .select("id")
    .eq("ticker", formData.ticker)
    .single();

  let positionId: string;

  if (existing) {
    positionId = existing.id;
  } else {
    // Create new position
    const { data: newPos, error } = await supabase
      .from("etf_positions")
      .insert({
        category_id: category.id,
        ticker: formData.ticker,
        name: formData.name,
        broker: formData.broker,
        shares: 0,
        avg_buy_price: 0,
        total_invested: 0,
        current_price: formData.current_price ?? null,
        current_value: 0,
      })
      .select("id")
      .single();
    if (error || !newPos) throw error ?? new Error("Failed to create position");
    positionId = newPos.id;
  }

  // Insert transaction
  const totalAmount = formData.shares * formData.price_per_share;
  await supabase.from("etf_transactions").insert({
    etf_position_id: positionId,
    type: formData.type,
    shares: formData.shares,
    price_per_share: formData.price_per_share,
    total_amount: totalAmount,
    fees: formData.fees,
    transaction_date: formData.transaction_date,
    notes: formData.notes || null,
  });

  // Recalculate position from all transactions
  const { data: allTx } = await supabase
    .from("etf_transactions")
    .select("*")
    .eq("etf_position_id", positionId);

  const calc = recalculatePosition((allTx as EtfTransaction[] | null) ?? []);
  const currentValue = formData.current_price
    ? calc.shares * formData.current_price
    : calc.shares * calc.avg_buy_price;

  await supabase
    .from("etf_positions")
    .update({
      shares: calc.shares,
      avg_buy_price: calc.avg_buy_price,
      total_invested: calc.total_invested,
      current_price: formData.current_price ?? null,
      current_value: currentValue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", positionId);

  toast.success("Transação registada");
  fetchPositions();
}
```

**Step 4: Verify build**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/lib/calculations.ts src/components/investments/etf-transaction-form.tsx src/app/investimentos/etfs/page.tsx
git commit -m "feat: add ETF transaction flow with auto position recalculation"
```

---

## Task 5: ETF Transaction History Dialog

**Files:**
- Create: `src/components/investments/transaction-history.tsx`
- Modify: `src/components/investments/etf-card.tsx`

**Step 1: Create transaction history component**

Create `src/components/investments/transaction-history.tsx`:

A dialog that receives a position ID, fetches all transactions for it from `etf_transactions` (or `crypto_transactions`), and displays them in a table sorted by date desc. Each row shows: date, type badge (Compra verde / Venda vermelho), shares, price, total, fees.

**Step 2: Add "Ver Transações" button to EtfCard**

Add a new button in the card footer that opens the transaction history dialog.

**Step 3: Verify and commit**

```bash
git add src/components/investments/transaction-history.tsx src/components/investments/etf-card.tsx
git commit -m "feat: add transaction history dialog to ETF cards"
```

---

## Task 6: Crypto Page — Full CRUD with transactions

**Files:**
- Create: `src/components/investments/crypto-card.tsx`
- Create: `src/components/investments/crypto-transaction-form.tsx`
- Create: `src/app/investimentos/crypto/page.tsx`

**Step 1: Create crypto transaction form**

Similar to ETF transaction form but:
- Uses CoinGecko search API (`/api/crypto/quote?search=bitcoin`) for coin lookup
- Shows coin ID, symbol, name
- Default currency: USD
- Prices in USD

**Step 2: Create crypto card**

Similar to `etf-card.tsx` but:
- Shows symbol (BTC) and name
- Shows value in USD (original) + EUR (converted) smaller
- P&L calculated same way as ETFs
- "Ver Transações" button

**Step 3: Create crypto page**

Pattern matches `etfs/page.tsx` but for crypto_positions and crypto_transactions. Uses `recalculatePosition()` from calculations.ts (same logic).

**Step 4: Verify and commit**

```bash
git add src/components/investments/crypto-card.tsx src/components/investments/crypto-transaction-form.tsx src/app/investimentos/crypto/page.tsx
git commit -m "feat: add crypto page with transaction-based tracking and CoinGecko prices"
```

---

## Task 7: Multi-currency display + exchange rate fetching

**Files:**
- Modify: `src/components/shared/currency-display.tsx`
- Create: `src/lib/hooks/use-exchange-rate.ts`

**Step 1: Create exchange rate hook**

Create `src/lib/hooks/use-exchange-rate.ts`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

let cachedRates: Record<string, number> = {};

export function useExchangeRate(from: string, to: string): number | null {
  const [rate, setRate] = useState<number | null>(
    from === to ? 1 : cachedRates[`${from}_${to}`] ?? null
  );

  useEffect(() => {
    if (from === to) { setRate(1); return; }
    const key = `${from}_${to}`;
    if (cachedRates[key]) { setRate(cachedRates[key]); return; }

    async function fetchRate() {
      const { data } = await getSupabase()
        .from("exchange_rates")
        .select("rate")
        .eq("from_currency", from)
        .eq("to_currency", to)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const r = Number((data as { rate: number }).rate);
        cachedRates[key] = r;
        setRate(r);
      }
    }

    fetchRate();
  }, [from, to]);

  return rate;
}
```

**Step 2: Update CurrencyDisplay to support multi-currency**

Add optional `currency` and `showEur` props. When `currency` is not EUR and `showEur` is true, show original value + EUR converted value below in smaller text.

**Step 3: Verify and commit**

```bash
git add src/lib/hooks/use-exchange-rate.ts src/components/shared/currency-display.tsx
git commit -m "feat: add multi-currency display with exchange rate conversion"
```

---

## Task 8: Update Dashboard components to include crypto

**Files:**
- Modify: `src/components/dashboard/patrimony-summary.tsx`
- Modify: `src/components/dashboard/allocation-pie.tsx`
- Modify: `src/app/investimentos/page.tsx`

**Step 1: Update patrimony-summary.tsx**

Add crypto_positions to the parallel fetch. Sum crypto values (converted to EUR using exchange rates from DB). Include in totalInvested and totalValue.

**Step 2: Update allocation-pie.tsx**

Add crypto category to the pie chart. Fetch crypto_positions and sum values (converted to EUR).

**Step 3: Update investments overview page**

Add crypto to the tabs and category cards in `src/app/investimentos/page.tsx`. Add a "Crypto" tab that shows crypto positions in the table.

**Step 4: Verify and commit**

```bash
git add src/components/dashboard/patrimony-summary.tsx src/components/dashboard/allocation-pie.tsx src/app/investimentos/page.tsx
git commit -m "feat: include crypto in dashboard totals, allocation chart, and overview"
```

---

## Task 9: Update Cron job for crypto prices + exchange rates

**Files:**
- Modify: `src/app/api/cron/update-prices/route.ts`

**Step 1: Extend cron route**

After updating ETF prices:
1. Fetch all crypto positions, get unique coin IDs
2. For each coin, fetch price via CoinGecko
3. Update crypto_positions (current_price, current_value)
4. Fetch EUR/USD rate via exchange-rate API
5. Save to exchange_rates table (upsert on from+to+date)
6. Include crypto_value in patrimony snapshot

**Step 2: Verify and commit**

```bash
git add src/app/api/cron/update-prices/route.ts
git commit -m "feat: update cron to fetch crypto prices and exchange rates"
```

---

## Task 10: Transaction Timeline Page

**Files:**
- Create: `src/app/transacoes/page.tsx`

**Step 1: Create timeline page**

Page that:
1. Fetches all `etf_transactions` (join with etf_positions for ticker/name)
2. Fetches all `crypto_transactions` (join with crypto_positions for symbol/name)
3. Merges and sorts by transaction_date desc
4. Shows table with columns: Data, Tipo (badge), Ativo, Categoria (color dot), Unidades, Preço, Total, Comissões
5. Filters at top: month/year dropdown, asset type (Todos/ETF/Crypto), transaction type (Todos/Compra/Venda)
6. Summary cards at top: total invested this month, number of transactions, breakdown by category

Since Supabase doesn't support cross-table joins easily from client, fetch both transaction types separately and merge in JS.

**Step 2: Verify and commit**

```bash
git add src/app/transacoes/page.tsx
git commit -m "feat: add global transaction timeline page with filters"
```

---

## Task 11: Final verification and cleanup

**Step 1: Run full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Test locally**

Start dev server, verify:
- ETF transaction flow (add transaction, position recalculates)
- Crypto page (search coin, add transaction, see P&L)
- Dashboard shows crypto in totals and pie chart
- Transaction timeline shows all transactions
- Multi-currency display works (USD values show EUR conversion)

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 2 - transactions, crypto, multi-currency, timeline"
```
