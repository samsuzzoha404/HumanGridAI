'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Circle } from 'lucide-react';
import { ActivityItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success animate-pulse" />
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Live Activity</h3>
        </div>
        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
      </div>

      <div className="max-h-[180px] sm:max-h-[200px] md:max-h-[220px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">
                {activity.username?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-foreground truncate">
                  <span className="font-medium">{activity.username || 'Anonymous'}</span>
                  <span className="text-muted-foreground"> earned </span>
                  <span className="text-success font-semibold">+${(activity.amount ?? 0).toFixed(2)}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {activity.taskType} • {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
              <Circle className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-success fill-success flex-shrink-0" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
