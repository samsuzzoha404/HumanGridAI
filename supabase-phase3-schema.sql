-- Phase 3: Event-driven data schema
-- This schema stores blockchain events for UI display
-- Supabase is TRANSPORT ONLY, not source of truth

-- Workers table (synced from blockchain events)
CREATE TABLE IF NOT EXISTS workers (
  address TEXT PRIMARY KEY,
  reputation_tier INTEGER DEFAULT 0,
  reputation_updated_at TIMESTAMP,
  total_earnings TEXT DEFAULT '0',
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  fraud_reports INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table (synced from blockchain + Rust service)
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  task_id TEXT UNIQUE NOT NULL,
  task_type TEXT NOT NULL,
  requester TEXT NOT NULL,
  worker TEXT NOT NULL,
  amount TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confidence_score FLOAT,
  proof_hash TEXT,
  payment_tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

-- Blockchain events table (event log)
CREATE TABLE IF NOT EXISTS blockchain_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(transaction_hash, log_index)
);

-- Fraud reports table
CREATE TABLE IF NOT EXISTS fraud_reports (
  id SERIAL PRIMARY KEY,
  report_id TEXT UNIQUE NOT NULL,
  task_id TEXT NOT NULL,
  worker TEXT NOT NULL,
  reporter TEXT,
  reason TEXT NOT NULL,
  evidence JSONB,
  status TEXT DEFAULT 'pending',
  action_taken TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Verification results table (cache from Rust service)
CREATE TABLE IF NOT EXISTS verification_results (
  id SERIAL PRIMARY KEY,
  task_id TEXT UNIQUE NOT NULL,
  verified BOOLEAN NOT NULL,
  confidence_score FLOAT NOT NULL,
  proof_hash TEXT NOT NULL,
  fraud_risk TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(worker);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workers_reputation ON workers(reputation_tier DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_processed ON blockchain_events(processed);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_type ON blockchain_events(event_type);

-- Row Level Security (RLS)
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_reports ENABLE ROW LEVEL SECURITY;

-- Public read access (write controlled by service role)
CREATE POLICY "Public read access on workers" ON workers FOR SELECT USING (true);
CREATE POLICY "Public read access on tasks" ON tasks FOR SELECT USING (true);

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments explaining authority
COMMENT ON TABLE workers IS 'Display cache only. Source of truth: Blockchain + Rust service';
COMMENT ON TABLE tasks IS 'Display cache only. Source of truth: Blockchain + Rust service';
COMMENT ON TABLE blockchain_events IS 'Event log from blockchain. Processed by event listener';
COMMENT ON TABLE verification_results IS 'Cache of Rust verification results. Not authoritative';
