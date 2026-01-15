'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Target, Trophy, TrendingUp } from 'lucide-react';

interface StatsRowProps {
  tasksSolvedToday?: number;
  accuracyScore?: number;
  currentRank?: number;
}

export function StatsRow({ tasksSolvedToday = 0, accuracyScore = 0, currentRank = 0 }: StatsRowProps) {
  const stats = [
    {
      label: 'Tasks Today',
      value: tasksSolvedToday.toString(),
      icon: CheckCircle2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      trend: '+12%',
    },
    {
      label: 'Accuracy',
      value: `${accuracyScore}%`,
      icon: Target,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      trend: '+2.5%',
    },
    {
      label: 'Global Rank',
      value: `#${currentRank}`,
      icon: Trophy,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary/20',
      trend: '↑ 15',
    },
    {
      label: 'Weekly Avg',
      value: '$8.45',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      trend: '+18%',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ y: -2 }}
            className="bento-item transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`inline-flex p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl ${stat.bgColor} ${stat.borderColor} border shadow-sm`}>
                <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 ${stat.color}`} />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-success bg-success/15 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-success/20">
                {stat.trend}
              </span>
            </div>
            <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${stat.color} font-mono-data mb-1 sm:mb-2 tracking-tight`}>{stat.value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
