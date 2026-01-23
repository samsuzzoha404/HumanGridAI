-- Circle Wallets Table for storing user wallet information
CREATE TABLE IF NOT EXISTS circle_wallets (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  circle_wallet_id VARCHAR(255) NOT NULL UNIQUE,
  wallet_address VARCHAR(42),
  blockchain VARCHAR(50) NOT NULL DEFAULT 'BASE-SEPOLIA',
  state VARCHAR(50) NOT NULL DEFAULT 'LIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX idx_circle_wallets_user_id ON circle_wallets(user_id);
CREATE INDEX idx_circle_wallets_circle_wallet_id ON circle_wallets(circle_wallet_id);
CREATE INDEX idx_circle_wallets_wallet_address ON circle_wallets(wallet_address);

-- Circle Transactions Table for payment history
CREATE TABLE IF NOT EXISTS circle_transactions (
  id BIGSERIAL PRIMARY KEY,
  circle_tx_id VARCHAR(255) NOT NULL UNIQUE,
  task_id BIGINT,
  from_wallet VARCHAR(255) NOT NULL,
  to_wallet VARCHAR(255) NOT NULL,
  amount DECIMAL(18, 6) NOT NULL,
  token_symbol VARCHAR(10) NOT NULL DEFAULT 'USDC',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_task FOREIGN KEY (task_id) 
    REFERENCES tasks(id) ON DELETE SET NULL
);

-- Index for transactions
CREATE INDEX idx_circle_transactions_circle_tx_id ON circle_transactions(circle_tx_id);
CREATE INDEX idx_circle_transactions_from_wallet ON circle_transactions(from_wallet);
CREATE INDEX idx_circle_transactions_to_wallet ON circle_transactions(to_wallet);
CREATE INDEX idx_circle_transactions_task_id ON circle_transactions(task_id);
CREATE INDEX idx_circle_transactions_status ON circle_transactions(status);

-- Update user_stats to include wallet address
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);
CREATE INDEX IF NOT EXISTS idx_user_stats_wallet_address ON user_stats(wallet_address);

-- Comments for documentation
COMMENT ON TABLE circle_wallets IS 'Stores Circle developer-controlled wallets for USDC payments';
COMMENT ON TABLE circle_transactions IS 'Records all USDC payment transactions via Circle API';
COMMENT ON COLUMN circle_wallets.circle_wallet_id IS 'Circle API wallet ID';
COMMENT ON COLUMN circle_wallets.wallet_address IS 'Blockchain wallet address (may be null for some wallet types)';
COMMENT ON COLUMN circle_transactions.blockchain_tx_hash IS 'On-chain transaction hash after settlement';
