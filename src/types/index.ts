// Supabase database Task interface
export interface Task {
  id: number;
  task_description: string;
  reward_amount: number;
  bot_name: string;
  status: string; // 'pending' | 'completed'
  created_at: string;
  // Optional UI-only fields
  taskType?: 'captcha' | 'sentiment' | 'labeling' | 'verification';
  botVersion?: string;
  timeRemaining?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'earning' | 'withdrawal';
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending';
}

export interface UserStats {
  totalEarnings: number;
  tasksSolvedToday: number;
  accuracyScore: number;
  currentRank: number;
  weeklyEarnings: number[];
}

export interface ActivityItem {
  id: string;
  username: string;
  amount: number;
  taskType: string;
  timestamp: Date;
}
