'use client';

import { motion } from 'framer-motion';
import { User, Award, BarChart3, Settings, ChevronRight, Shield, Zap, Star, Clock, TrendingUp } from 'lucide-react';
import { UserStats } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ProfileViewProps {
  stats: UserStats;
}

export function ProfileView({ stats }: ProfileViewProps) {
  const levelProgress = 75;
  const currentLevel = 12;
  const memberId = 'ARC-7A9F-4B2C';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground">Your stats and achievements</p>
      </motion.div>

      {/* Bento Grid for Profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Profile Header - 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-item p-6 md:col-span-2"
        >
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary p-0.5 flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                <User className="w-8 h-8 text-foreground" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1">Worker_0x7a9F</h2>
              <p className="text-sm text-muted-foreground mb-3">Arc Network Contributor</p>
              
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="ai" className="gap-1">
                  <Star className="w-3 h-3" />
                  Level {currentLevel}
                </Badge>
                <Badge variant="success">Top 5%</Badge>
                <span className="text-xs text-muted-foreground font-mono-data">{memberId}</span>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/30">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to Level {currentLevel + 1}</span>
              <span className="text-foreground font-medium font-mono-data">{levelProgress}%</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Complete <span className="font-mono-data text-primary">25</span> more tasks to level up
            </p>
          </div>
        </motion.div>

        {/* Stats Cards - 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bento-item p-5"
        >
          <div className="p-3 rounded-xl bg-secondary/10 w-fit mb-3">
            <Award className="w-6 h-6 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-foreground font-mono-data">{stats.accuracyScore}%</p>
          <p className="text-sm text-muted-foreground">Accuracy Rate</p>
          <div className="mt-3 flex items-center gap-1 text-xs text-success">
            <TrendingUp className="w-3 h-3" />
            +2.5% this week
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bento-item p-5"
        >
          <div className="p-3 rounded-xl bg-primary/10 w-fit mb-3">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground font-mono-data">{stats.tasksSolvedToday}</p>
          <p className="text-sm text-muted-foreground">Tasks Today</p>
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Avg: 45s per task
          </div>
        </motion.div>

        {/* Achievements - Full width on lg */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bento-item overflow-hidden md:col-span-2 lg:col-span-4"
        >
          <div className="p-4 lg:p-5 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Achievements</h3>
            <span className="text-xs text-muted-foreground font-mono-data">3/12 unlocked</span>
          </div>
          <div className="p-4 lg:p-5 flex gap-4 overflow-x-auto pb-4">
            {[
              { icon: Zap, label: 'Speed Demon', desc: '100 tasks < 30s', color: 'text-primary', unlocked: true },
              { icon: Shield, label: 'Verified Pro', desc: '99% accuracy', color: 'text-success', unlocked: true },
              { icon: Star, label: 'Top Earner', desc: 'Weekly top 10', color: 'text-secondary', unlocked: true },
              { icon: Award, label: 'Elite Worker', desc: 'Level 20', color: 'text-muted-foreground', unlocked: false },
              { icon: TrendingUp, label: 'Rising Star', desc: '30 day streak', color: 'text-muted-foreground', unlocked: false },
            ].map((achievement, i) => (
              <motion.div
                key={achievement.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={`flex-shrink-0 w-28 text-center ${!achievement.unlocked ? 'opacity-40' : ''}`}
              >
                <div className={`w-14 h-14 mx-auto mb-2 rounded-xl ${achievement.unlocked ? 'bg-muted/50' : 'bg-muted/20'} flex items-center justify-center border border-border/30`}>
                  <achievement.icon className={`w-6 h-6 ${achievement.color}`} />
                </div>
                <p className="text-sm font-medium text-foreground">{achievement.label}</p>
                <p className="text-xs text-muted-foreground">{achievement.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Menu Items - 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bento-item overflow-hidden md:col-span-2"
        >
          {[
            { icon: Settings, label: 'Settings', desc: 'Preferences and notifications' },
            { icon: Shield, label: 'Security', desc: 'Two-factor and wallet security' },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
            >
              <div className="p-2.5 rounded-xl bg-muted/50">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <span className="block text-foreground font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Network Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bento-item p-5 md:col-span-2"
        >
          <h4 className="text-sm font-medium text-foreground mb-4">Network Status</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Arc Network</span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span className="text-sm text-success font-medium">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Response Time</span>
              <span className="text-sm font-mono-data text-foreground">23ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Session ID</span>
              <span className="text-sm font-mono-data text-muted-foreground">sess_8f2k...9d3m</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
