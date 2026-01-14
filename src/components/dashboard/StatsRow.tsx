import { motion } from 'framer-motion';
import { CheckCircle2, Target, Trophy, TrendingUp } from 'lucide-react';

interface StatsRowProps {
  tasksSolvedToday: number;
  accuracyScore: number;
  currentRank: number;
}

export function StatsRow({ tasksSolvedToday, accuracyScore, currentRank }: StatsRowProps) {
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bento-item p-4 lg:p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`inline-flex p-2.5 rounded-xl ${stat.bgColor} ${stat.borderColor} border`}>
                <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                {stat.trend}
              </span>
            </div>
            <p className={`text-2xl lg:text-3xl font-bold ${stat.color} font-mono-data`}>{stat.value}</p>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
