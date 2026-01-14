export interface Task {
  id: string;
  botName: string;
  botVersion: string;
  taskType: 'captcha' | 'sentiment' | 'labeling' | 'verification';
  description: string;
  reward: number;
  timeRemaining: number;
  difficulty: 'easy' | 'medium' | 'hard';
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
