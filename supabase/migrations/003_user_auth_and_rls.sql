-- ============================================
-- Migration 003: User Auth & RLS
-- ============================================

-- 1. Add user_id to all tables
ALTER TABLE generic_assets ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE etf_positions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE certificados_aforro ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE ppr ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE bank_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE liquid_cash ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE patrimony_snapshots ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE goals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE alerts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE crypto_positions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- Add user_id to categories (allows null for global categories)
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- Note: etf_transactions, crypto_transactions, etf_price_history, exchange_rates either map to isolated parents or are global

-- 2. Drop the old wide-open "Allow all" policies
DROP POLICY IF EXISTS "Allow all" ON generic_assets;
DROP POLICY IF EXISTS "Allow all" ON etf_positions;
DROP POLICY IF EXISTS "Allow all" ON certificados_aforro;
DROP POLICY IF EXISTS "Allow all" ON ppr;
DROP POLICY IF EXISTS "Allow all" ON bank_accounts;
DROP POLICY IF EXISTS "Allow all" ON liquid_cash;
DROP POLICY IF EXISTS "Allow all" ON patrimony_snapshots;
DROP POLICY IF EXISTS "Allow all" ON goals;
DROP POLICY IF EXISTS "Allow all" ON alerts;
DROP POLICY IF EXISTS "Allow all" ON crypto_positions;
DROP POLICY IF EXISTS "Allow all" ON categories;

-- 3. Create new RLS policies isolated to the authenticated user ID
CREATE POLICY "Users can only access their own assets" ON generic_assets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own etf_positions" ON etf_positions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own certificados" ON certificados_aforro FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own pprs" ON ppr FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own bank_accounts" ON bank_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own liquid_cash" ON liquid_cash FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own snapshots" ON patrimony_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own goals" ON goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own alerts" ON alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own crypto_positions" ON crypto_positions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Categories logic (users can see global OR their own custom categories)
CREATE POLICY "Users can see global or own categories" ON categories FOR ALL USING (user_id IS NULL OR auth.uid() = user_id) WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Make transactions derive from their parent position ownership (so users only insert/read tx for positions they own)
DROP POLICY IF EXISTS "Allow all" ON etf_transactions;
DROP POLICY IF EXISTS "Allow all" ON crypto_transactions;

CREATE POLICY "Users manage transactions of their ETFs" ON etf_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM etf_positions WHERE id = etf_transactions.etf_position_id AND user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM etf_positions WHERE id = etf_transactions.etf_position_id AND user_id = auth.uid())
);

CREATE POLICY "Users manage transactions of their Crypto" ON crypto_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM crypto_positions WHERE id = crypto_transactions.crypto_position_id AND user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM crypto_positions WHERE id = crypto_transactions.crypto_position_id AND user_id = auth.uid())
);
