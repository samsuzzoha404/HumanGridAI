'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Sparkles, SlidersHorizontal, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { memo, useMemo } from 'react';

interface TaskStreamProps {
  tasks: Task[];
  onAccept: (task: Task) => void;
  onSkip: (taskId: string | number) => void;
  onTimeout?: (taskId: string | number) => void;
}

export const TaskStream = memo(function TaskStream({ tasks, onAccept, onSkip, onTimeout }: TaskStreamProps) {
  const taskTypeFilters = useMemo(() => ['All Tasks', 'Captcha', 'Sentiment', 'Labeling', 'Verification'], []);
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">Task Stream</h2>
            <Badge variant="live" className="flex-shrink-0 text-[10px] sm:text-xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-success"></span>
              </span>
              LIVE
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="font-mono-data text-primary">{tasks.length}</span> verified AI tasks waiting
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Network Status */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-success/10 border border-success/20">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-success" />
            <span className="text-[10px] sm:text-xs text-success font-medium">Arc Network</span>
          </div>
          
          {/* Security Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs text-primary font-medium">Verified</span>
          </div>
          
          <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
            <SlidersHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Filters</span>
          </Button>
        </div>
      </motion.div>

      {/* Task Type Quick Filters - Mobile Scrollable */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
      >
        {taskTypeFilters.map((type, i) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
              i === 0 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
            }`}
          >
            {type}
          </motion.button>
        ))}
      </motion.div>

      {/* Task Cards Grid - Responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -50 }}
              transition={{ delay: index * 0.05 }}
            >
              <TaskCard
                task={task}
                onAccept={onAccept}
                onSkip={onSkip}
                onTimeout={onTimeout}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {tasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 sm:p-12 lg:p-16 text-center"
        >
          <motion.div 
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </motion.div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">All caught up!</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            New tasks from AI agents will appear here soon. Keep this page open to catch them first.
          </p>
          
          {/* Animated waiting indicator */}
          <div className="flex items-center justify-center gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
});