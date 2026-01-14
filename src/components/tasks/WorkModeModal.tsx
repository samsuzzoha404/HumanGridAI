import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, CheckCircle, Loader2, Send, Sparkles, Bot, Clock, Zap } from 'lucide-react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealisticCaptcha } from '@/components/tasks/RealisticCaptcha';
import confetti from 'canvas-confetti';

interface WorkModeModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, reward: number) => void;
}

export function WorkModeModal({ task, isOpen, onClose, onComplete }: WorkModeModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [captchaCompleted, setCaptchaCompleted] = useState(false);

  if (!task) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#3B82F6', '#8B5CF6'],
    });
    
    // Wait for animation then complete
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    onComplete(task.id, task.reward);
    setIsSuccess(false);
    setSelectedOption(null);
    setCaptchaCompleted(false);
    onClose();
  };

  const handleCaptchaComplete = (selected: number[]) => {
    setCaptchaCompleted(true);
    // Auto-submit after captcha completion
    setTimeout(() => {
      handleSubmit();
    }, 500);
  };

  const sentimentOptions = [
    { label: '😠', sublabel: 'Angry', value: 1 },
    { label: '😐', sublabel: 'Neutral', value: 2 },
    { label: '😊', sublabel: 'Happy', value: 3 },
  ];

  const getCaptchaPrompt = () => {
    const prompts = ['traffic lights', 'crosswalks', 'vehicles', 'bicycles', 'buses'];
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const handleClose = () => {
    setSelectedOption(null);
    setCaptchaCompleted(false);
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-sm sm:max-w-md glass-card overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-secondary/30 to-primary/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{task.botName}</h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <Badge variant="ai" className="text-[10px]">{task.botVersion}</Badge>
                    <Badge variant="reward" className="text-[10px] sm:text-xs">+${task.reward.toFixed(2)} USDC</Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {isSuccess ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6 sm:py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
                  </motion.div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Task Complete!</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    You earned <span className="text-success font-bold">+${task.reward.toFixed(2)} USDC</span>
                  </p>
                  
                  {/* Blockchain confirmation animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="font-mono-data">Transaction confirmed on Arc Network</span>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  {/* Task type specific UI */}
                  {task.taskType === 'captcha' || task.taskType === 'labeling' ? (
                    <RealisticCaptcha 
                      prompt={getCaptchaPrompt()}
                      onComplete={handleCaptchaComplete}
                      gridSize={3}
                    />
                  ) : task.taskType === 'sentiment' ? (
                    <>
                      {/* Sentiment task UI */}
                      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Analyze this content:</p>
                        <p className="text-sm sm:text-base text-foreground italic">"{task.description}"</p>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center">
                        What emotion does this express?
                      </p>

                      <div className="flex gap-2 sm:gap-3 justify-center mb-4 sm:mb-6">
                        {sentimentOptions.map((option, index) => (
                          <motion.button
                            key={option.value}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedOption(index)}
                            className={`flex flex-col items-center p-3 sm:p-4 rounded-xl border transition-all ${
                              selectedOption === index
                                ? 'border-primary bg-primary/20 text-foreground shadow-lg shadow-primary/20'
                                : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            <span className="text-2xl sm:text-3xl mb-1">{option.label}</span>
                            <span className="text-[10px] sm:text-xs font-medium">{option.sublabel}</span>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Generic task UI */}
                      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Task Description:</p>
                        <p className="text-sm sm:text-base text-foreground">{task.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4 sm:mb-6">
                        {['Yes, Correct', 'No, Incorrect', 'Partially', 'Cannot Tell'].map((option, index) => (
                          <motion.button
                            key={option}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedOption(index)}
                            className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                              selectedOption === index
                                ? 'border-primary bg-primary/20 text-foreground'
                                : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            {option}
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer - Only show for non-captcha tasks or if not in success state */}
            {!isSuccess && task.taskType !== 'captcha' && task.taskType !== 'labeling' && (
              <div className="p-3 sm:p-4 border-t border-border">
                <Button
                  variant="success"
                  size="lg"
                  className="w-full gap-2 text-sm sm:text-base"
                  onClick={handleSubmit}
                  disabled={selectedOption === null || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      Submit Solution
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}