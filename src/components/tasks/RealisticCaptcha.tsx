'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Check, RotateCcw, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptchaGridProps {
  prompt: string;
  onComplete: (selected: number[]) => void;
  gridSize?: 3 | 4;
}

// Realistic street scene image URLs (using placeholder patterns)
const streetImages = [
  'linear-gradient(135deg, hsl(220 15% 25%) 0%, hsl(220 15% 35%) 100%)', // dark road
  'linear-gradient(45deg, hsl(45 70% 55%) 0%, hsl(45 80% 45%) 100%)', // traffic light yellow
  'linear-gradient(180deg, hsl(200 60% 50%) 0%, hsl(200 70% 60%) 100%)', // sky blue
  'linear-gradient(90deg, hsl(0 70% 45%) 0%, hsl(0 80% 55%) 100%)', // red car
  'linear-gradient(135deg, hsl(220 10% 40%) 0%, hsl(220 15% 50%) 100%)', // sidewalk
  'linear-gradient(45deg, hsl(120 40% 30%) 0%, hsl(120 50% 40%) 100%)', // tree/grass
  'linear-gradient(180deg, hsl(30 60% 50%) 0%, hsl(30 70% 40%) 100%)', // building
  'linear-gradient(0deg, hsl(45 10% 80%) 0%, hsl(45 15% 90%) 100%)', // crosswalk
  'linear-gradient(90deg, hsl(0 0% 20%) 0%, hsl(0 0% 30%) 100%)', // vehicle shadow
];

const captchaIcons: Record<string, string[]> = {
  'traffic lights': ['🚦', '🔴', '🟡', '🟢', '🚗', '🏢', '🌳', '🚶', '🚙'],
  'crosswalks': ['🚶', '⬜', '🛤️', '🚗', '🏢', '🌳', '🚙', '🚌', '🏪'],
  'vehicles': ['🚗', '🚙', '🚌', '🏍️', '🚲', '🏢', '🌳', '🚶', '🚦'],
  'bicycles': ['🚲', '🚴', '🏍️', '🚗', '🏢', '🌳', '🚶', '🚦', '🚙'],
  'buses': ['🚌', '🚍', '🚗', '🚙', '🏢', '🌳', '🚶', '🚦', '🏪'],
  'motorcycles': ['🏍️', '🛵', '🚗', '🚙', '🏢', '🌳', '🚶', '🚦', '🚲'],
};

export function RealisticCaptcha({ prompt, onComplete, gridSize = 3 }: CaptchaGridProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const totalCells = gridSize * gridSize;
  
  // Determine correct answers based on prompt (simplified logic)
  const correctCells = [0, 3, 6]; // These would be the cells with the target objects
  
  // Get icons for this captcha type
  const promptKey = Object.keys(captchaIcons).find(key => 
    prompt.toLowerCase().includes(key)
  ) || 'traffic lights';
  const icons = captchaIcons[promptKey];

  const toggleCell = (index: number) => {
    if (isVerifying || verified) return;
    
    setSelected(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleVerify = async () => {
    if (selected.length === 0) return;
    
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setVerified(true);
    setIsVerifying(false);
    onComplete(selected);
  };

  const handleReset = () => {
    setSelected([]);
    setVerified(false);
  };

  return (
    <div className="w-full">
      {/* Captcha Header */}
      <div className="bg-primary/10 border border-primary/20 rounded-t-xl p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-foreground truncate">
              Select all squares with
            </p>
            <p className="text-sm sm:text-base font-bold text-primary truncate">{prompt}</p>
          </div>
        </div>
      </div>

      {/* Captcha Grid */}
      <div 
        className={cn(
          "grid gap-0.5 sm:gap-1 bg-border/50 p-0.5 sm:p-1 rounded-b-xl overflow-hidden",
          gridSize === 3 ? "grid-cols-3" : "grid-cols-4"
        )}
      >
        {Array.from({ length: totalCells }).map((_, index) => {
          const isSelected = selected.includes(index);
          const isCorrect = correctCells.includes(index);
          
          return (
            <motion.button
              key={index}
              whileHover={{ scale: verified ? 1 : 1.02 }}
              whileTap={{ scale: verified ? 1 : 0.98 }}
              onClick={() => toggleCell(index)}
              className={cn(
                "relative aspect-square rounded-sm sm:rounded-md overflow-hidden transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                isSelected && !verified && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                verified && isSelected && isCorrect && "ring-2 ring-success",
                verified && isSelected && !isCorrect && "ring-2 ring-destructive"
              )}
              style={{
                background: streetImages[index % streetImages.length],
              }}
            >
              {/* Icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">
                  {icons[index % icons.length]}
                </span>
              </div>
              
              {/* Selection overlay */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-primary/30 flex items-center justify-center"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                  </div>
                </motion.div>
              )}

              {/* Verified overlay */}
              {verified && isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    isCorrect ? "bg-success/30" : "bg-destructive/30"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center",
                    isCorrect ? "bg-success" : "bg-destructive"
                  )}>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
                  </div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3 sm:mt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="p-2 sm:p-2.5 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: selected.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: selected.length > 0 ? 0.98 : 1 }}
          onClick={handleVerify}
          disabled={selected.length === 0 || isVerifying || verified}
          className={cn(
            "flex-1 py-2.5 sm:py-3 px-4 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200",
            "flex items-center justify-center gap-2",
            selected.length > 0 && !verified
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : verified
                ? "bg-success/20 text-success border border-success/30"
                : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : verified ? (
            <>
              <Check className="w-4 h-4" />
              <span>Verified!</span>
            </>
          ) : (
            <span>VERIFY</span>
          )}
        </motion.button>
      </div>
    </div>
  );
}