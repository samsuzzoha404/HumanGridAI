'use client';

import { motion } from 'framer-motion';
import { Home, Layers, Wallet, User, Zap, Settings, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
    <aside className="hidden lg:flex flex-col w-56 xl:w-64 h-screen bg-sidebar border-r border-sidebar-border/60 fixed left-0 top-0 shadow-2xl">
      {/* Logo */}
      <div className="p-5 xl:p-7 border-b border-sidebar-border/60">
        <Link href="/" className="flex items-center gap-3 xl:gap-3.5 hover:opacity-80 transition-opacity group">
          <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/35 transition-all duration-300">
            <Zap className="w-5 h-5 xl:w-5.5 xl:h-5.5 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg xl:text-xl text-foreground">HumanGrid</h1>
              <span className="text-sm xl:text-base text-primary font-bold">AI</span>
            </div>
            <p className="text-xs xl:text-xs text-muted-foreground font-medium">by BlockNexa Labs</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 xl:p-5 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ x: 6 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "w-full flex items-center gap-3 xl:gap-3.5 px-4 xl:px-4.5 py-3 xl:py-3.5 rounded-xl transition-all duration-300 text-left shadow-sm",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-lg shadow-primary/10"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-md border border-transparent"
              )}
            >
              <Icon className="w-5 h-5 xl:w-5 xl:h-5" />
              <span className="font-semibold text-sm xl:text-base">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Network Stats */}
      <div className="p-4 xl:p-5 border-t border-sidebar-border/60">
        <div className="p-3.5 xl:p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3 xl:space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 xl:gap-2.5">
              <div className="p-1 rounded-lg bg-primary/15 border border-primary/25">
                <Activity className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-primary" />
              </div>
              <span className="text-xs xl:text-xs text-muted-foreground font-medium">Network</span>
            </div>
            <span className="text-xs xl:text-xs font-mono-data text-foreground font-semibold">1.2M TPS</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 xl:gap-2.5">
              <div className="p-1 rounded-lg bg-success/15 border border-success/25">
                <Shield className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-success" />
              </div>
              <span className="text-xs xl:text-xs text-muted-foreground font-medium">Validators</span>
            </div>
            <span className="text-xs xl:text-xs font-mono-data text-foreground font-semibold">2,847</span>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-4 xl:p-5 border-t border-sidebar-border/60">
        <button className="w-full flex items-center gap-3 xl:gap-3.5 px-4 xl:px-4.5 py-3 xl:py-3.5 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-300 text-sm xl:text-base font-semibold shadow-sm hover:shadow-md">
          <Settings className="w-5 h-5 xl:w-5 xl:h-5" />
          <span>Settings</span>
        </button>
        
        {/* Connection status */}
        <div className="mt-4 xl:mt-4 p-3 xl:p-3.5 rounded-xl bg-success/15 border border-success/30 shadow-lg shadow-success/10">
          <div className="flex items-center gap-2 xl:gap-2.5">
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