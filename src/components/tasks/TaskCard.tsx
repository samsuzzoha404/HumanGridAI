import { motion } from 'framer-motion';
import { Bot, Clock, Sparkles, Brain, Eye, Shield } from 'lucide-react';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import taskPreviewBg from '@/assets/task-preview-bg.png';

interface TaskCardProps {
  task: Task;
  onAccept: (task: Task) => void;
  onSkip: (taskId: string) => void;
}

const taskTypeIcons = {
  captcha: Shield,
  sentiment: Brain,
  labeling: Eye,
  verification: Sparkles,
};

export function TaskCard({ task, onAccept, onSkip }: TaskCardProps) {
  const [timeLeft, setTimeLeft] = useState(task.timeRemaining);
  const Icon = taskTypeIcons[task.taskType];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeProgress = (timeLeft / task.timeRemaining) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      whileHover={{ 
        y: -4,
        boxShadow: '0 0 30px hsl(217 91% 60% / 0.12), 0 20px 40px -20px hsl(0 0% 0% / 0.4)'
      }}
      transition={{ duration: 0.3 }}
      className="glass-card-hover overflow-hidden h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-secondary/30 to-primary/30 flex items-center justify-center">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">{task.botName}</h3>
                <Badge variant="ai" className="text-[9px] sm:text-[10px] font-mono-data">{task.botVersion}</Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">{task.taskType} Task</p>
            </div>
          </div>
          <Badge variant={task.difficulty} className="capitalize text-[10px] sm:text-xs">
            {task.difficulty}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex-1">
        <div className="flex items-start gap-2 sm:gap-3 mb-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-muted/50">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          </div>
          <p className="text-xs sm:text-sm text-foreground/90 flex-1 leading-relaxed">{task.description}</p>
        </div>

        {task.imageUrl && (
          <div className="rounded-lg overflow-hidden h-20 sm:h-24 relative border border-border/30">
            <img 
              src={taskPreviewBg} 
              alt="Task preview" 
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-card/90 via-card/50 to-transparent">
              <div className="text-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" />
                <p className="text-[10px] sm:text-xs text-foreground/80 font-medium">Preview Available</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 bg-muted/20 border-t border-border/30 mt-auto">
        {/* Time remaining */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] sm:text-xs text-muted-foreground font-mono-data">{timeLeft}s</span>
          <Progress 
            value={timeProgress} 
            className="flex-1 h-1 sm:h-1.5"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button
              variant="accept"
              size="sm"
              className="w-full gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
              onClick={() => onAccept(task)}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Accept
              <Badge variant="reward" className="ml-0.5 sm:ml-1 font-mono-data text-[9px] sm:text-[10px]">
                +${task.reward.toFixed(2)}
              </Badge>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="skip"
              size="sm"
              className="text-xs sm:text-sm h-8 sm:h-9"
              onClick={() => onSkip(task.id)}
            >
              Skip
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}