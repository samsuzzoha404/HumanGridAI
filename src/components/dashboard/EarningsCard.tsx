'use client';

import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';

interface EarningsCardProps {
  totalEarnings: number;
  weeklyEarnings?: number[];
}

export function EarningsCard({ totalEarnings, weeklyEarnings = [0,0,0,0,0,0,0] }: EarningsCardProps) {
  const maxEarning = Math.max(...weeklyEarnings);
  const weekTotal = weeklyEarnings.reduce((a, b) => a + b, 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bento-item noise-overlay h-full"
    >
      <div className="flex items-start justify-between mb-5 sm:mb-6 md:mb-7">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 font-medium">Total Earnings</p>
          <motion.div
            key={totalEarnings}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="flex items-baseline gap-2 sm:gap-2.5"
          >
            <span className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold text-gradient-success font-mono-data tracking-tight">
              ${totalEarnings.toFixed(2)}
            </span>
            <span className="text-base sm:text-lg md:text-xl text-success/70 font-semibold">USDC</span>
          </motion.div>
        </div>
        <div className="p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-success/15 border border-success/30 shadow-lg shadow-success/10">
          <DollarSign className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-success" />
        </div>
      </div>

      {/* Week summary */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-muted/40 border border-border/40 shadow-sm">
        <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-success/15 border border-success/25">
          <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-success" />
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground font-medium">This week:</span>
        <span className="text-xs sm:text-sm font-bold text-success font-mono-data ml-auto">+${weekTotal.toFixed(2)}</span>
      </div>

      {/* Sparkline */}
      <div>
        <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
          <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-success/15 border border-success/25">
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-success" />
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold tracking-wide uppercase">Last 7 days</span>
        </div>
        <div className="flex items-end gap-1.5 sm:gap-2 h-16 sm:h-18 md:h-20">
          {weeklyEarnings.map((earning, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(earning / maxEarning) * 100}%` }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
              className="flex-1 rounded-t-md bg-gradient-to-t from-success/50 to-success min-h-[8px] relative group cursor-pointer shadow-sm hover:shadow-lg hover:shadow-success/30 transition-all"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-foreground text-xs px-2.5 py-1.5 rounded-lg font-mono-data whitespace-nowrap pointer-events-none shadow-xl border border-border/50">
                ${earning.toFixed(2)}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-2 sm:mt-3 text-[9px] sm:text-[10px] md:text-[11px] text-muted-foreground font-mono-data font-semibold">
          <span>Mon</span>
          <span className="hidden xs:inline">Tue</span>
          <span>Wed</span>
          <span className="hidden xs:inline">Thu</span>
          <span className="hidden xs:inline">Fri</span>
          <span className="hidden xs:inline">Sat</span>
          <span>Sun</span>
        </div>
      </div>
    </motion.div>
  );
}
