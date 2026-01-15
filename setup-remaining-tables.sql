-- =====================================================
-- Run this in Supabase SQL Editor
-- This will create the remaining tables needed
-- =====================================================

-- 1. USER STATS TABLE
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

CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- 2. ACTIVITY FEED TABLE
CREATE TABLE IF NOT EXISTS activity_feed (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  username VARCHAR(255),
  task_id BIGINT REFERENCES tasks(id),
  task_type VARCHAR(100),
  amount DECIMAL(10, 4),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_timestamp ON activity_feed(timestamp DESC);

-- 3. STORED PROCEDURE
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

-- 4. INSERT DEMO DATA
-- Demo user stats
INSERT INTO user_stats (user_id, total_earnings, tasks_solved_today, accuracy_score, current_rank, weekly_earnings)
VALUES ('demo-user-id', 45.20, 127, 98.5, 342, ARRAY[3.20, 5.80, 4.50, 7.20, 6.90, 8.40, 9.20])
ON CONFLICT (user_id) DO NOTHING;

-- Note: If you need to add demo tasks, run insert-demo-tasks.sql separately

-- 5. ENABLE REAL-TIME for activity_feed
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE user_stats;
