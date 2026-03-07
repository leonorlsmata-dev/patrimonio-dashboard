# Patrimonio Dashboard — Phase 1 (MVP) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working personal patrimony dashboard with manual entry for all asset types and automatic ETF price fetching.

**Architecture:** Next.js 15 App Router with server components by default, client components only for interactive elements (forms, charts). Supabase PostgreSQL for data storage. Yahoo Finance for ETF prices via server-side API routes. Vercel Cron for daily automated updates.

**Tech Stack:** Next.js 15, TypeScript, shadcn/ui, Tailwind CSS, Recharts 3, Supabase, yahoo-finance2, React Hook Form, Zod, date-fns, Lucide React, next-themes

---

## Task 1: Project Scaffolding

**Files:**
- Create: `patrimonio-dashboard/` (entire Next.js project)
- Create: `.env.local`
- Create: `.gitignore`

**Step 1: Create Next.js project**

```bash
cd "c:/Users/sofia/Desktop/Primeiro"
npx create-next-app@latest patrimonio-dashboard --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project created with src/ directory, App Router, TypeScript, Tailwind.

**Step 2: Move project files to root**

```bash
# Move everything from patrimonio-dashboard/ to the root Primeiro/ directory
cd "c:/Users/sofia/Desktop/Primeiro"
mv patrimonio-dashboard/* patrimonio-dashboard/.* . 2>/dev/null
rmdir patrimonio-dashboard
```

**Step 3: Install dependencies**

```bash
cd "c:/Users/sofia/Desktop/Primeiro"
npm install @supabase/supabase-js yahoo-finance2 recharts react-hook-form @hookform/resolvers zod date-fns lucide-react next-themes
```

Expected: All packages installed successfully.

**Step 4: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Expected: shadcn/ui initialized with default config.

**Step 5: Add shadcn components**

```bash
npx shadcn@latest add button card dialog form input select table tabs toast badge separator sheet dropdown-menu skeleton sonner
```

Expected: All UI components added to src/components/ui/.

**Step 6: Create .env.local template**

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-random-cron-secret
```

**Step 7: Initialize git and commit**

```bash
cd "c:/Users/sofia/Desktop/Primeiro"
git init
git add -A
git commit -m "chore: scaffold Next.js project with shadcn/ui and dependencies"
```

---

## Task 2: Database Schema (SQL Migration)

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create migration file**

Create `supabase/migrations/001_initial_schema.sql` with the complete schema:

```sql
-- ============================================
-- Dashboard de Património Pessoal
-- Migration 001: Initial Schema
-- ============================================

-- 1. Categories (extensible by user)
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 28.00,
    is_custom BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, display_name, icon, color, tax_rate, sort_order) VALUES
    ('etf', 'ETFs', 'TrendingUp', '#3B82F6', 28.00, 1),
    ('certificado_aforro', 'Certificados de Aforro', 'Shield', '#10B981', 28.00, 2),
    ('ppr', 'PPR', 'PiggyBank', '#8B5CF6', 8.00, 3),
    ('conta_bancaria', 'Contas Bancárias', 'Landmark', '#F59E0B', 28.00, 4),
    ('dinheiro_liquido', 'Dinheiro Líquido', 'Wallet', '#6B7280', 0.00, 5),
    ('trade_republic_cash', 'Cash Trade Republic', 'CircleDollarSign', '#EF4444', 0.00, 6);

-- 2. Generic assets (for custom/future categories)
CREATE TABLE generic_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    invested_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    start_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ETF positions
CREATE TABLE etf_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) NOT NULL,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    broker TEXT DEFAULT 'Trade Republic',
    shares DECIMAL(12,6) NOT NULL,
    avg_buy_price DECIMAL(12,4) NOT NULL,
    total_invested DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    current_price DECIMAL(12,4),
    current_value DECIMAL(12,2),
    last_price_update TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ETF transactions
CREATE TABLE etf_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    etf_position_id UUID REFERENCES etf_positions(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    shares DECIMAL(12,6) NOT NULL,
    price_per_share DECIMAL(12,4) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    fees DECIMAL(8,2) DEFAULT 0.00,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ETF price history
CREATE TABLE etf_price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker TEXT NOT NULL,
    price DECIMAL(12,4) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticker, date)
);

CREATE INDEX idx_price_history_ticker_date ON etf_price_history(ticker, date DESC);

-- 6. Certificados de Aforro
CREATE TABLE certificados_aforro (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) NOT NULL,
    series TEXT NOT NULL,
    invested_amount DECIMAL(12,2) NOT NULL,
    current_value DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,3),
    subscription_date DATE NOT NULL,
    maturity_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PPR
CREATE TABLE ppr (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    invested_amount DECIMAL(12,2) NOT NULL,
    current_value DECIMAL(12,2) NOT NULL,
    risk_profile TEXT CHECK (risk_profile IN ('conservador', 'moderado', 'dinamico')),
    start_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bank accounts
CREATE TABLE bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) NOT NULL,
    bank_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('corrente', 'poupanca')),
    balance DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,3) DEFAULT 0.000,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Liquid cash
CREATE TABLE liquid_cash (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) NOT NULL,
    description TEXT DEFAULT 'Dinheiro líquido',
    amount DECIMAL(12,2) NOT NULL,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Patrimony snapshots (daily)
CREATE TABLE patrimony_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_value DECIMAL(14,2) NOT NULL,
    etf_value DECIMAL(12,2) DEFAULT 0,
    certificados_value DECIMAL(12,2) DEFAULT 0,
    ppr_value DECIMAL(12,2) DEFAULT 0,
    bank_value DECIMAL(12,2) DEFAULT 0,
    cash_value DECIMAL(12,2) DEFAULT 0,
    trade_republic_cash_value DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_date ON patrimony_snapshots(date DESC);

-- 11. Goals
CREATE TABLE goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount DECIMAL(14,2) NOT NULL,
    current_amount DECIMAL(14,2) DEFAULT 0,
    target_date DATE,
    category TEXT,
    icon TEXT,
    color TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Alerts
CREATE TABLE alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('price_above', 'price_below', 'goal_milestone', 'portfolio_value')),
    target_value DECIMAL(14,2) NOT NULL,
    reference_ticker TEXT,
    reference_goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    message TEXT,
    is_triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (permissive for single user)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE generic_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_aforro ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppr ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquid_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrimony_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Permissive policies (single user app)
CREATE POLICY "Allow all" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON generic_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON etf_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON etf_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON etf_price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON certificados_aforro FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ppr FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bank_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON liquid_cash FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON patrimony_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON alerts FOR ALL USING (true) WITH CHECK (true);
```

**Step 2: Commit**

```bash
git add supabase/
git commit -m "feat: add complete database schema migration"
```

---

## Task 3: Supabase Client + TypeScript Types

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/types.ts`

**Step 1: Create browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

**Step 2: Create server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, serviceRoleKey);
}
```

**Step 3: Create TypeScript types**

Create `src/lib/supabase/types.ts` with full Database type matching schema (all tables, Row/Insert/Update types).

**Step 4: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase client and database types"
```

---

## Task 4: Core Utilities and Constants

**Files:**
- Create: `src/lib/utils.ts` (extend existing shadcn file)
- Create: `src/lib/constants.ts`
- Create: `src/types/investment.ts`

**Step 1: Extend utils.ts**

Add to existing `src/lib/utils.ts`:

```typescript
// Keep existing cn() from shadcn, add:
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-PT").format(new Date(date));
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
```

**Step 2: Create constants**

Create `src/lib/constants.ts`:

```typescript
export const ASSET_CATEGORIES = {
  etf: { label: "ETFs", color: "#3B82F6", icon: "TrendingUp" },
  certificado_aforro: { label: "Certificados de Aforro", color: "#10B981", icon: "Shield" },
  ppr: { label: "PPR", color: "#8B5CF6", icon: "PiggyBank" },
  conta_bancaria: { label: "Contas Bancárias", color: "#F59E0B", icon: "Landmark" },
  dinheiro_liquido: { label: "Dinheiro Líquido", color: "#6B7280", icon: "Wallet" },
  trade_republic_cash: { label: "Cash Trade Republic", color: "#EF4444", icon: "CircleDollarSign" },
} as const;

export const TAX_RATES = {
  capital_gains: 0.28,
  interest: 0.28,
  ppr_8_plus_years_retirement: 0.08,
  ppr_8_plus_years_other: 0.172,
  ppr_5_to_8_years: 0.215,
  ppr_under_5_years: 0.28,
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/investimentos", label: "Investimentos", icon: "Briefcase" },
  { href: "/investimentos/etfs", label: "ETFs", icon: "TrendingUp" },
  { href: "/investimentos/certificados", label: "Certificados", icon: "Shield" },
  { href: "/investimentos/ppr", label: "PPR", icon: "PiggyBank" },
  { href: "/investimentos/contas", label: "Contas", icon: "Landmark" },
  { href: "/objetivos", label: "Objetivos", icon: "Target" },
  { href: "/projecoes", label: "Projeções", icon: "TrendingUp" },
  { href: "/impostos", label: "Impostos", icon: "Receipt" },
  { href: "/alertas", label: "Alertas", icon: "Bell" },
] as const;
```

**Step 3: Create investment types**

Create `src/types/investment.ts` with TypeScript interfaces for all investment entities.

**Step 4: Commit**

```bash
git add src/lib/utils.ts src/lib/constants.ts src/types/
git commit -m "feat: add utilities, constants, and TypeScript types"
```

---

## Task 5: Layout (Sidebar + Header + Mobile Nav)

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Create: `src/components/layout/page-header.tsx`
- Create: `src/components/providers.tsx`

**Step 1: Create ThemeProvider wrapper**

Create `src/components/providers.tsx`:

```typescript
"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

**Step 2: Create sidebar**

Create `src/components/layout/sidebar.tsx` — Desktop sidebar with Lucide icons for all NAV_ITEMS, active state highlighting, collapsible.

**Step 3: Create header**

Create `src/components/layout/header.tsx` — Top bar with app name "Meu Património", theme toggle button (Sun/Moon icons).

**Step 4: Create mobile navigation**

Create `src/components/layout/mobile-nav.tsx` — Bottom fixed bar for mobile with Sheet (hamburger menu) containing all nav links.

**Step 5: Create page header component**

Create `src/components/layout/page-header.tsx` — Reusable component with title and optional description.

**Step 6: Update root layout**

Modify `src/app/layout.tsx`:
- Set `<html lang="pt">`
- Wrap with Providers (ThemeProvider)
- Add sidebar (hidden on mobile), header, mobile nav
- Main content area with proper padding

**Step 7: Create shell pages**

Create placeholder pages for all routes:
- `src/app/investimentos/page.tsx`
- `src/app/investimentos/etfs/page.tsx`
- `src/app/investimentos/certificados/page.tsx`
- `src/app/investimentos/ppr/page.tsx`
- `src/app/investimentos/contas/page.tsx`
- `src/app/objetivos/page.tsx`
- `src/app/projecoes/page.tsx`
- `src/app/impostos/page.tsx`
- `src/app/alertas/page.tsx`

Each with just a PageHeader component.

**Step 8: Verify and commit**

```bash
npm run build
git add .
git commit -m "feat: add layout with sidebar, header, mobile nav, and page shells"
```

---

## Task 6: Shared Components

**Files:**
- Create: `src/components/shared/currency-display.tsx`
- Create: `src/components/shared/percentage-badge.tsx`
- Create: `src/components/shared/empty-state.tsx`

**Step 1: Create currency display**

```typescript
"use client";

import { formatCurrency } from "@/lib/utils";

export function CurrencyDisplay({ value, className }: { value: number; className?: string }) {
  return <span className={className}>{formatCurrency(value)}</span>;
}
```

**Step 2: Create percentage badge**

Component that shows green for positive, red for negative percentages.

**Step 3: Create empty state**

Component with icon, title, description, and optional action button. Used when no data exists yet.

**Step 4: Commit**

```bash
git add src/components/shared/
git commit -m "feat: add shared UI components (currency, percentage, empty state)"
```

---

## Task 7: Dashboard Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/dashboard/patrimony-summary.tsx`
- Create: `src/components/dashboard/allocation-pie.tsx`
- Create: `src/components/dashboard/quick-actions.tsx`

**Step 1: Create patrimony summary card**

`src/components/dashboard/patrimony-summary.tsx` — Big card showing total net worth. Fetches totals from all Supabase tables and sums them. Shows total value, daily change placeholder.

**Step 2: Create allocation pie chart**

`src/components/dashboard/allocation-pie.tsx` — Recharts PieChart with ResponsiveContainer. Shows distribution by category (ETFs, Certificados, PPR, Contas, Cash). Uses colors from ASSET_CATEGORIES constant.

**Step 3: Create quick actions**

`src/components/dashboard/quick-actions.tsx` — Grid of buttons linking to: "Adicionar ETF", "Atualizar Certificados", "Atualizar PPR", "Atualizar Contas".

**Step 4: Assemble dashboard page**

Modify `src/app/page.tsx`:
- PageHeader: "Dashboard"
- PatrimonySummary card (full width)
- 2-column grid: AllocationPie (left), QuickActions (right)
- EmptyState when no data

**Step 5: Verify and commit**

```bash
npm run build
git add .
git commit -m "feat: add dashboard with patrimony summary, allocation chart, and quick actions"
```

---

## Task 8: ETF Management

**Files:**
- Create: `src/lib/finance/yahoo.ts`
- Create: `src/app/api/etf/quote/route.ts`
- Modify: `src/app/investimentos/etfs/page.tsx`
- Create: `src/components/investments/etf-card.tsx`
- Create: `src/components/investments/etf-form.tsx`

**Step 1: Create Yahoo Finance wrapper**

`src/lib/finance/yahoo.ts`:

```typescript
import yahooFinance from "yahoo-finance2";

export async function getQuote(ticker: string) {
  const result = await yahooFinance.quote(ticker);
  return {
    ticker: result.symbol,
    price: result.regularMarketPrice ?? 0,
    currency: result.currency ?? "EUR",
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    name: result.shortName ?? result.longName ?? ticker,
  };
}

export async function searchTicker(query: string) {
  const result = await yahooFinance.search(query);
  return result.quotes
    .filter((q) => q.quoteType === "ETF" || q.quoteType === "EQUITY")
    .map((q) => ({
      ticker: q.symbol,
      name: q.shortname ?? q.longname ?? q.symbol,
      exchange: q.exchange,
    }));
}
```

**Step 2: Create API route for ETF quotes**

`src/app/api/etf/quote/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/finance/yahoo";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }
  try {
    const quote = await getQuote(ticker);
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
```

**Step 3: Create ETF card component**

`src/components/investments/etf-card.tsx` — Card showing: ticker, name, shares, avg buy price, current price, total value, P&L (gain/loss with color), edit/delete buttons.

**Step 4: Create ETF form**

`src/components/investments/etf-form.tsx` — Dialog with React Hook Form + Zod validation. Fields: ticker (with auto-price fetch), name, shares, average buy price, broker. On ticker blur, calls /api/etf/quote to get current price.

**Step 5: Wire up ETF page**

Modify `src/app/investimentos/etfs/page.tsx`:
- Fetch ETF positions from Supabase
- Display as grid of EtfCard components
- "Adicionar ETF" button opens EtfForm dialog
- EmptyState when no ETFs

**Step 6: Verify and commit**

```bash
npm run build
git add .
git commit -m "feat: add ETF management with auto price fetching"
```

---

## Task 9: Manual Entry Forms (Certificados, PPR, Contas, Cash)

**Files:**
- Modify: `src/app/investimentos/certificados/page.tsx`
- Create: `src/components/investments/certificate-form.tsx`
- Modify: `src/app/investimentos/ppr/page.tsx`
- Create: `src/components/investments/ppr-form.tsx`
- Modify: `src/app/investimentos/contas/page.tsx`
- Create: `src/components/investments/account-form.tsx`
- Create: `src/components/investments/cash-form.tsx`

**Step 1: Certificados de Aforro page + form**

Form fields: Série (text), Montante Investido (number), Valor Atual (number), Taxa de Juro (number), Data de Subscrição (date), Notas (text).
Page: list cards + "Adicionar" button.

**Step 2: PPR page + form**

Form fields: Nome (text), Entidade (text), Montante Investido (number), Valor Atual (number), Perfil de Risco (select: Conservador/Moderado/Dinâmico), Data de Início (date), Notas (text).
Page: list cards + "Adicionar" button.

**Step 3: Contas page + account form + cash form**

Account form fields: Banco (text), Tipo (select: Corrente/Poupança), Saldo (number), Taxa de Juro (number, optional), Notas (text).
Cash form fields: Descrição (text), Montante (number), Localização (text), Notas (text).
Page: two sections — Contas Bancárias and Dinheiro Líquido, each with own "Adicionar" button.

**Step 4: Verify and commit**

```bash
npm run build
git add .
git commit -m "feat: add manual entry forms for certificados, PPR, bank accounts, and cash"
```

---

## Task 10: Investments Overview Page

**Files:**
- Modify: `src/app/investimentos/page.tsx`

**Step 1: Build overview page**

Modify `src/app/investimentos/page.tsx`:
- Summary cards at top: one per category showing total value
- Tabs component: Todos | ETFs | Certificados | PPR | Contas
- Table under each tab listing investments with columns: Nome, Categoria, Valor Investido, Valor Atual, Ganho/Perda
- "Todos" tab shows everything combined

**Step 2: Verify and commit**

```bash
npm run build
git add .
git commit -m "feat: add investments overview page with category tabs and summary"
```

---

## Task 11: Cron Job for Daily Price Updates

**Files:**
- Create: `src/app/api/cron/update-prices/route.ts`
- Create: `vercel.json`

**Step 1: Create cron route**

`src/app/api/cron/update-prices/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getQuote } from "@/lib/finance/yahoo";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // 1. Get all ETF positions
  const { data: positions } = await supabase.from("etf_positions").select("*");
  if (!positions?.length) {
    return NextResponse.json({ message: "No positions to update" });
  }

  // 2. Get unique tickers
  const tickers = [...new Set(positions.map((p) => p.ticker))];

  // 3. Fetch prices and update
  for (const ticker of tickers) {
    try {
      const quote = await getQuote(ticker);
      // Update positions
      await supabase
        .from("etf_positions")
        .update({
          current_price: quote.price,
          current_value: 0, // will be calculated per position
          last_price_update: new Date().toISOString(),
        })
        .eq("ticker", ticker);

      // Update each position's current_value
      const tickerPositions = positions.filter((p) => p.ticker === ticker);
      for (const pos of tickerPositions) {
        await supabase
          .from("etf_positions")
          .update({ current_value: Number(pos.shares) * quote.price })
          .eq("id", pos.id);
      }

      // Save to price history
      await supabase.from("etf_price_history").upsert({
        ticker,
        price: quote.price,
        currency: quote.currency,
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error(`Failed to update ${ticker}:`, error);
    }
  }

  // 4. Create patrimony snapshot
  // ... sum all categories and insert into patrimony_snapshots

  return NextResponse.json({ message: "Prices updated", tickers });
}
```

**Step 2: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/update-prices",
      "schedule": "0 18 * * 1-5"
    }
  ]
}
```

**Step 3: Verify and commit**

```bash
npm run build
git add .
git commit -m "feat: add daily cron job for ETF price updates and patrimony snapshots"
```

---

## Task 12: Final Verification

**Step 1: Full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Run dev server and manual test**

```bash
npm run dev
```

Test checklist:
- [ ] Dashboard loads with empty state
- [ ] Sidebar navigation works on desktop
- [ ] Mobile navigation works
- [ ] Can add an ETF position (ticker auto-fetches price)
- [ ] Can add Certificado de Aforro
- [ ] Can add PPR
- [ ] Can add bank account
- [ ] Can add liquid cash
- [ ] Dashboard pie chart shows allocation after adding data
- [ ] Investments overview shows all entries
- [ ] Theme toggle works (light/dark)

**Step 3: Final commit**

```bash
git add .
git commit -m "chore: phase 1 MVP complete"
```
