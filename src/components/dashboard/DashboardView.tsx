import { EarningsCard } from '@/components/dashboard/EarningsCard';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { UserStats, ActivityItem } from '@/types';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardViewProps {
  stats: UserStats;
  activities: ActivityItem[];
  onStartWorking: () => void;
}

export function DashboardView({ stats, activities, onStartWorking }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Welcome back! 👋</h1>
        <p className="text-muted-foreground">Ready to earn some USDC?</p>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Earnings Card - Spans 2 columns on larger screens */}
        <div className="md:col-span-2">
          <EarningsCard 
            totalEarnings={stats.totalEarnings} 
            weeklyEarnings={stats.weeklyEarnings} 
          />
        </div>

        {/* Quick Start Button - Full width on mobile, 2 cols on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <div className="bento-item p-6 flex flex-col justify-center h-full">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-1">Ready to work?</h3>
              <p className="text-sm text-muted-foreground">Jump into the task stream and start earning instantly.</p>
            </div>
            <Button
              variant="gradient"
              size="xl"
              className="w-full gap-2 group"
              onClick={onStartWorking}
            >
              <Sparkles className="w-5 h-5" />
              Start Earning Now
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Row - Full width grid */}
        <div className="md:col-span-2 lg:col-span-4">
          <StatsRow 
            tasksSolvedToday={stats.tasksSolvedToday}
            accuracyScore={stats.accuracyScore}
            currentRank={stats.currentRank}
          />
        </div>

        {/* Activity Feed - Full width on mobile, spans 4 on desktop */}
        <div className="md:col-span-2 lg:col-span-4">
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
