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
