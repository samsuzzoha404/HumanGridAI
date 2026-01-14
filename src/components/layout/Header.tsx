import { motion } from 'framer-motion';
import { Zap, Bell, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  totalEarnings: number;
}

export function Header({ totalEarnings }: HeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border safe-area-pt">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm sm:text-base text-foreground">HumanGrid</span>
            <span className="text-[10px] sm:text-xs text-primary font-semibold">AI</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Earnings pill */}
          <motion.div
            key={totalEarnings}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-success/10 border border-success/20"
          >
            <span className="text-success font-bold text-xs sm:text-sm font-mono-data">
              ${totalEarnings.toFixed(2)}
            </span>
            <span className="text-success/70 text-[10px] sm:text-xs hidden xs:inline">USDC</span>
          </motion.div>

          {/* Notifications */}
          <button className="relative p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors touch-target">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
          </button>
        </div>
      </div>
    </header>
  );
}