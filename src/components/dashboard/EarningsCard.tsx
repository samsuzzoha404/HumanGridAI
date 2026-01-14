import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';

interface EarningsCardProps {
  totalEarnings: number;
  weeklyEarnings: number[];
}

export function EarningsCard({ totalEarnings, weeklyEarnings }: EarningsCardProps) {
  const maxEarning = Math.max(...weeklyEarnings);
  const weekTotal = weeklyEarnings.reduce((a, b) => a + b, 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bento-item p-6 noise-overlay h-full"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Total Earnings</p>
          <motion.div
            key={totalEarnings}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="flex items-baseline gap-2"
          >
            <span className="text-4xl lg:text-5xl font-bold text-gradient-success font-mono-data">
              ${totalEarnings.toFixed(2)}
            </span>
            <span className="text-lg text-success/70">USDC</span>
          </motion.div>
        </div>
        <div className="p-3 rounded-xl bg-success/10 border border-success/20">
          <DollarSign className="w-6 h-6 text-success" />
        </div>
      </div>

      {/* Week summary */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/30 border border-border/30">
        <ArrowUpRight className="w-4 h-4 text-success" />
        <span className="text-sm text-muted-foreground">This week:</span>
        <span className="text-sm font-semibold text-success font-mono-data">+${weekTotal.toFixed(2)}</span>
      </div>

      {/* Sparkline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-xs text-muted-foreground">Last 7 days</span>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {weeklyEarnings.map((earning, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(earning / maxEarning) * 100}%` }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-success/40 to-success min-h-[6px] relative group cursor-pointer"
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-foreground text-xs px-2 py-1 rounded font-mono-data whitespace-nowrap pointer-events-none">
                ${earning.toFixed(2)}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono-data">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>
    </motion.div>
  );
}
