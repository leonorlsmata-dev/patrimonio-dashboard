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
