'use client';

import { motion } from 'framer-motion';
import { Bot, Clock, Sparkles, Brain, Eye, Shield, Zap, TrendingUp } from 'lucide-react';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState, memo, useMemo, useCallback } from 'react';
import Image from 'next/image';
import taskPreviewBg from '@/assets/task-preview-bg.png';

interface TaskCardProps {
  task: Task;
  onAccept: (task: Task) => void;
  onSkip: (taskId: string | number) => void;
  onTimeout?: (taskId: string | number) => void;
}

const taskTypeIcons = {
  captcha: Shield,
  sentiment: Brain,
  labeling: Eye,
  verification: Sparkles,
  default: Sparkles,
};

const taskTypeColors = {
  captcha: 'from-blue-500/20 via-cyan-500/20 to-blue-600/20',
  sentiment: 'from-purple-500/20 via-pink-500/20 to-purple-600/20',
  labeling: 'from-green-500/20 via-emerald-500/20 to-green-600/20',
  verification: 'from-orange-500/20 via-amber-500/20 to-orange-600/20',
  default: 'from-primary/20 via-secondary/20 to-primary/20',
};

export const TaskCard = memo(function TaskCard({ task, onAccept, onSkip, onTimeout }: TaskCardProps) {
  const [timeLeft, setTimeLeft] = useState(task.timeRemaining || 30);
  const [isHovered, setIsHovered] = useState(false);
  
  const Icon = useMemo(() => taskTypeIcons[task.taskType as keyof typeof taskTypeIcons] || taskTypeIcons.default, [task.taskType]);
  const gradientColor = useMemo(() => taskTypeColors[task.taskType as keyof typeof taskTypeColors] || taskTypeColors.default, [task.taskType]);

  const handleAccept = useCallback(() => onAccept(task), [onAccept, task]);
  const handleSkip = useCallback(() => onSkip(task.id), [onSkip, task.id]);

  // Reset timer when task changes
  useEffect(() => {
    setTimeLeft(task.timeRemaining || 30);
  }, [task.id, task.timeRemaining]);

  useEffect(() => {
    if (!task.timeRemaining) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev > 0 ? prev - 1 : 0;
        // Trigger timeout when reaching 0
        if (newTime === 0 && prev === 1 && onTimeout) {
          setTimeout(() => onTimeout(task.id), 100);
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [task.timeRemaining, task.id, onTimeout]);

  const timeProgress = task.timeRemaining ? (timeLeft / task.timeRemaining) * 100 : 0;
  const isUrgent = timeLeft <= 10;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, x: -100, filter: 'blur(8px)' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        y: -10,
        scale: 1.02,
      }}
      transition={{ 
        duration: 0.5,
        type: "spring",
        stiffness: 280,
        damping: 22
      }}
      className="relative group h-[380px] sm:h-[400px] md:h-[420px]"
    >
      {/* Glow effect on hover */}
      <motion.div 
        className={`absolute -inset-[2px] bg-gradient-to-r ${gradientColor} rounded-2xl opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700`}
        animate={isHovered ? {
          scale: [1, 1.08, 1],
        } : {}}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      
      {/* Card container */}
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-card/98 via-card/95 to-card/98 border border-border/60 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col transition-all duration-500 group-hover:border-border/80">
        {/* Animated gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header with premium design */}
          <div className="p-4 sm:p-5 border-b border-border/30 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
              {/* Bot info */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradientColor} p-[2px] shadow-lg`}
                >
                  <div className="w-full h-full rounded-lg sm:rounded-xl bg-card/95 backdrop-blur-sm flex items-center justify-center">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  {/* Pulse effect */}
                  <motion.div 
                    className="absolute inset-0 rounded-xl bg-primary/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <h3 className="font-bold text-foreground text-sm sm:text-base truncate">{task.bot_name}</h3>
                    <Badge variant="ai" className="text-[9px] sm:text-[10px] font-mono-data px-1.5 sm:px-2 py-0.5 bg-primary/10 border-primary/20 flex-shrink-0">
                      {task.botVersion || 'v2.0'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-[11px] sm:text-xs text-muted-foreground capitalize font-medium truncate">
                      {task.taskType || 'Agent'} Task
                    </p>
                  </div>
                </div>
              </div>

              {/* Difficulty badge */}
              <Badge 
                variant={task.difficulty as any || 'easy'} 
                className="capitalize text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 font-semibold shadow-lg flex-shrink-0"
              >
                {task.difficulty || 'easy'}
              </Badge>
            </div>

            {/* Reward highlight */}
            <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/15 border border-primary/30 shadow-lg shadow-primary/10">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-foreground">Reward:</span>
              <span className="text-xs sm:text-sm font-mono-data font-bold text-primary ml-auto">
                +${(task.reward_amount || 0).toFixed(2)} USDC
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3 sm:gap-4 min-h-0">
            {/* Task description */}
            <div className="flex-1 min-h-0">
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed line-clamp-2">
                {task.task_description}
              </p>
            </div>

            {task.imageUrl && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="rounded-lg sm:rounded-xl overflow-hidden h-16 sm:h-18 md:h-20 relative border border-border/30 shadow-lg flex-shrink-0"
              >
                <Image 
                  src={taskPreviewBg} 
                  alt="Task preview" 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover opacity-60"
                  quality={75}
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/40 to-transparent flex items-center justify-center z-10">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="text-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mx-auto mb-0.5" />
                    <p className="text-[9px] sm:text-[10px] text-foreground/90 font-semibold">Preview Available</p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 pt-0 space-y-2.5 sm:space-y-3 flex-shrink-0">
            {/* Time remaining with enhanced design */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <motion.div
                    animate={isUrgent ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isUrgent ? 'text-red-500' : 'text-muted-foreground'}`} />
                  </motion.div>
                  <span className={`text-[11px] sm:text-xs font-mono-data font-semibold ${isUrgent ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {timeLeft}s remaining
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                  {Math.round(timeProgress)}%
                </span>
              </div>
              <div className="relative h-2 bg-muted/40 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                <motion.div
                  className={`h-full rounded-full ${
                    isUrgent 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                      : 'bg-gradient-to-r from-primary via-secondary to-primary'
                  } shadow-lg`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${timeProgress}%` }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="h-full w-full bg-white/30"
                    animate={{ x: ['0%', '100%'] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Actions with premium buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1"
              >
                <Button
                  variant="accept"
                  size="sm"
                  className="w-full gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-all duration-300"
                  onClick={handleAccept}
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Accept </span>Task
                </Button>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="skip"
                  size="sm"
                  className="text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-5 font-semibold"
                  onClick={handleSkip}
                >
                  Skip
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});