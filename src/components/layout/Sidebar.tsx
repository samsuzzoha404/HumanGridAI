import { motion } from 'framer-motion';
import { Home, Layers, Wallet, User, Zap, Settings, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'tasks', label: 'Task Stream', icon: Layers },
  { id: 'wallet', label: 'Arc Wallet', icon: Wallet },
  { id: 'profile', label: 'Profile', icon: User },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-56 xl:w-64 h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 xl:p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2 xl:gap-3">
          <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Zap className="w-4 h-4 xl:w-5 xl:h-5 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="font-bold text-base xl:text-lg text-foreground">HumanGrid</h1>
              <span className="text-xs xl:text-sm text-primary font-bold">AI</span>
            </div>
            <p className="text-[10px] xl:text-xs text-muted-foreground">by BlockNexa Labs</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 xl:p-4 space-y-1 xl:space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-lg transition-all duration-200 text-left",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 xl:w-5 xl:h-5" />
              <span className="font-medium text-sm xl:text-base">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Network Stats */}
      <div className="p-3 xl:p-4 border-t border-sidebar-border">
        <div className="p-2.5 xl:p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2 xl:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 xl:gap-2">
              <Activity className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-primary" />
              <span className="text-[10px] xl:text-xs text-muted-foreground">Network</span>
            </div>
            <span className="text-[10px] xl:text-xs font-mono-data text-foreground">1.2M TPS</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 xl:gap-2">
              <Shield className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-success" />
              <span className="text-[10px] xl:text-xs text-muted-foreground">Validators</span>
            </div>
            <span className="text-[10px] xl:text-xs font-mono-data text-foreground">2,847</span>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-3 xl:p-4 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm xl:text-base">
          <Settings className="w-4 h-4 xl:w-5 xl:h-5" />
          <span className="font-medium">Settings</span>
        </button>
        
        {/* Connection status */}
        <div className="mt-3 xl:mt-4 p-2.5 xl:p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-1.5 xl:gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-[10px] xl:text-xs text-success font-medium">Arc Network Connected</span>
          </div>
          <p className="text-[10px] xl:text-xs text-success/70 mt-1 font-mono-data">Block #48,293,847</p>
        </div>
      </div>
    </aside>
  );
}