CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  bot_name VARCHAR(255) NOT NULL,
  bot_version VARCHAR(50),
  task_type VARCHAR(100) NOT NULL,
  task_description TEXT NOT NULL,
  reward_amount DECIMAL(10, 4) NOT NULL,
  time_remaining INTEGER,
  difficulty VARCHAR(50),
  image_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  assigned_to VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bot_version VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_remaining INTEGER;

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

CREATE TABLE IF NOT EXISTS user_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  total_earnings DECIMAL(10, 4) DEFAULT 0,
  tasks_solved_today INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5, 2) DEFAULT 0,
  current_rank INTEGER,
  weekly_earnings DECIMAL(10, 4)[] DEFAULT ARRAY[0,0,0,0,0,0,0],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

CREATE TABLE IF NOT EXISTS activity_feed (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  username VARCHAR(255),
  task_id BIGINT REFERENCES tasks(id),
  task_type VARCHAR(100),
  amount DECIMAL(10, 4),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_feed(timestamp DESC);

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 4) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);

CREATE OR REPLACE FUNCTION increment_user_earnings(
  p_user_id VARCHAR(255),
  p_amount DECIMAL(10, 4)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_earnings, tasks_solved_today)
  VALUES (p_user_id, p_amount, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_earnings = user_stats.total_earnings + p_amount,
    tasks_solved_today = user_stats.tasks_solved_today + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public tasks are viewable by everyone"
  ON tasks FOR SELECT
  USING (status = 'pending');

CREATE POLICY "Users can update their assigned tasks"
  ON tasks FOR UPDATE
  USING (auth.uid()::text = assigned_to);

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Activity feed is public"
  ON activity_feed FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = user_id);

INSERT INTO tasks (bot_name, bot_version, task_type, task_description, reward_amount, time_remaining, difficulty, image_url, status)
VALUES 
  ('TravelAgent_Bot', 'v2.3', 'captcha', 'Solve this image captcha to verify human presence', 0.05, 25, 'easy', '/placeholder.svg', 'pending'),
  ('SentimentAI', 'v1.8', 'sentiment', 'Is this tweet expressing anger, joy, or neutral emotion?', 0.08, 30, 'medium', NULL, 'pending'),
  ('DataLabeler_Pro', 'v3.1', 'labeling', 'Label all vehicles in this street image', 0.12, 45, 'hard', '/placeholder.svg', 'pending'),
  ('VerifyBot', 'v2.0', 'verification', 'Verify if this product image matches the description', 0.06, 20, 'easy', '/placeholder.svg', 'pending'),
  ('ContentMod_AI', 'v4.2', 'sentiment', 'Rate the toxicity level of this comment (1-5)', 0.10, 35, 'medium', NULL, 'pending'),
  ('ImageClassifier', 'v1.5', 'labeling', 'Select all images containing traffic lights', 0.07, 40, 'easy', '/placeholder.svg', 'pending');

INSERT INTO user_stats (user_id, total_earnings, tasks_solved_today, accuracy_score, current_rank, weekly_earnings)
VALUES ('demo-user-id', 45.20, 127, 98.5, 342, ARRAY[3.20, 5.80, 4.50, 7.20, 6.90, 8.40, 9.20]);