import { motion } from 'framer-motion';
import { Home, Layers, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'tasks', label: 'Tasks', icon: Layers },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'profile', label: 'Profile', icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
      {/* Safe area padding for iOS */}
      <div className="flex items-center justify-around py-1.5 sm:py-2 px-2 sm:px-4 pb-[calc(0.375rem+env(safe-area-inset-bottom))] sm:pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 min-w-[56px] sm:min-w-[64px] touch-target",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 transition-transform",
                  isActive && "scale-110"
                )} />
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={cn(
                "text-[9px] sm:text-[10px] font-medium transition-colors",
                isActive && "text-primary"
              )}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}