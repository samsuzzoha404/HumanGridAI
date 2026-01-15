'use client';

import { motion } from 'framer-motion';
import { Zap, Bell, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface HeaderProps {
  totalEarnings?: number;
}

export function Header({ totalEarnings = 0 }: HeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-background/85 backdrop-blur-2xl border-b border-border/60 safe-area-pt shadow-lg">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-foreground" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base sm:text-lg text-foreground">HumanGrid</span>
            <span className="text-xs sm:text-sm text-primary font-bold">AI</span>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Earnings pill */}
          <motion.div
            key={totalEarnings}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-success/15 border border-success/30 shadow-lg shadow-success/10"
          >
            <span className="text-success font-bold text-sm sm:text-base font-mono-data">
              ${totalEarnings.toFixed(2)}
            </span>
            <span className="text-success/70 text-xs sm:text-sm hidden xs:inline font-semibold">USDC</span>
          </motion.div>

          {/* Notifications */}
          <button className="relative p-2 sm:p-2.5 rounded-xl hover:bg-muted/60 transition-all duration-200 touch-target hover:shadow-md">
            <Bell className="w-5 h-5 sm:w-5 sm:h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
          </button>
        </div>
      </div>
    </header>
  );
}