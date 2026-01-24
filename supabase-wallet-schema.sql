
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS wallet_id VARCHAR(255) UNIQUE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255) UNIQUE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS wallet_blockchain VARCHAR(50) DEFAULT 'ETH-ARC-TESTNET';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS wallet_created_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_wallet_id ON auth.users(wallet_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON auth.users(wallet_address);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount_usdc DECIMAL(20, 8) NOT NULL,
    transfer_id VARCHAR(255) UNIQUE,
    transaction_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    task_id UUID REFERENCES tasks(id),
    from_wallet VARCHAR(255),
    to_wallet VARCHAR(255),
    description TEXT,
    metadata JSONB,
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_task_id ON wallet_transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_transfer_id ON wallet_transactions(transfer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at ON wallet_transactions(created_at DESC);

CREATE OR REPLACE VIEW wallet_balances AS
SELECT 
    u.id as user_id,
    u.wallet_id,
    u.wallet_address,
    COALESCE(SUM(
        CASE 
            WHEN wt.transaction_type = 'payment_received' AND wt.status = 'confirmed' THEN wt.amount_usdc
            WHEN wt.transaction_type = 'withdrawal' AND wt.status = 'confirmed' THEN -wt.amount_usdc
            WHEN wt.transaction_type = 'bonus' AND wt.status = 'confirmed' THEN wt.amount_usdc
            ELSE 0
        END
    ), 0) as balance_usdc,
    COUNT(CASE WHEN wt.status = 'confirmed' THEN 1 END) as transaction_count,
    MAX(wt.confirmed_at) as last_transaction_at
FROM auth.users u
LEFT JOIN wallet_transactions wt ON u.id = wt.user_id
WHERE u.wallet_id IS NOT NULL
GROUP BY u.id, u.wallet_id, u.wallet_address;

CREATE OR REPLACE FUNCTION update_wallet_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_transactions_updated_at
    BEFORE UPDATE ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_transactions_updated_at();
