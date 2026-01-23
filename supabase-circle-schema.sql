CREATE TABLE IF NOT EXISTS circle_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  circle_wallet_id TEXT NOT NULL UNIQUE,
  wallet_address TEXT,
  blockchain TEXT NOT NULL DEFAULT 'BASE-SEPOLIA',
  wallet_set_id TEXT,
  state TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS circle_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_tx_id TEXT NOT NULL UNIQUE,
  task_id UUID,
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  token_symbol TEXT DEFAULT 'USDC',
  status TEXT NOT NULL DEFAULT 'pending',
  blockchain_tx_hash TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS circle_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id TEXT NOT NULL UNIQUE,  -- For idempotency deduplication
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  signature TEXT,
  key_id TEXT,
  processed BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_circle_wallets_user_id ON circle_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_wallets_wallet_id ON circle_wallets(circle_wallet_id);
CREATE INDEX IF NOT EXISTS idx_circle_transactions_task_id ON circle_transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_circle_transactions_status ON circle_transactions(status);
CREATE INDEX IF NOT EXISTS idx_circle_webhook_events_processed ON circle_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_circle_webhook_events_type ON circle_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_circle_webhook_events_notification_id ON circle_webhook_events(notification_id);  -- For fast idempotency checks

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_circle_wallets_updated_at ON circle_wallets;
CREATE TRIGGER update_circle_wallets_updated_at BEFORE UPDATE ON circle_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE circle_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallets" ON circle_wallets;
CREATE POLICY "Users can view own wallets"
  ON circle_wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON circle_transactions;
CREATE POLICY "Users can view own transactions"
  ON circle_transactions FOR SELECT
  USING (
    to_wallet IN (SELECT circle_wallet_id FROM circle_wallets WHERE user_id = auth.uid())
    OR from_wallet IN (SELECT circle_wallet_id FROM circle_wallets WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role full access wallets" ON circle_wallets;
CREATE POLICY "Service role full access wallets"
  ON circle_wallets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access transactions" ON circle_transactions;
CREATE POLICY "Service role full access transactions"
  ON circle_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access webhooks" ON circle_webhook_events;
CREATE POLICY "Service role full access webhooks"
  ON circle_webhook_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
