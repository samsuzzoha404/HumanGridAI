import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { TaskStream } from '@/components/tasks/TaskStream';
import { WorkModeModal } from '@/components/tasks/WorkModeModal';
import { WalletView } from '@/components/wallet/WalletView';
import { ProfileView } from '@/components/profile/ProfileView';
import { Web3Background } from '@/components/ui/Web3Background';
import { mockTasks, mockUserStats, mockTransactions, mockActivityFeed } from '@/data/mockData';
import { Task, UserStats, ActivityItem } from '@/types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [stats, setStats] = useState<UserStats>(mockUserStats);
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivityFeed);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simulate live activity feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity: ActivityItem = {
        id: `a${Date.now()}`,
        username: `User_${Math.floor(Math.random() * 999)}`,
        amount: parseFloat((Math.random() * 0.15 + 0.03).toFixed(2)),
        taskType: ['Captcha', 'Sentiment', 'Labeling', 'Verification'][Math.floor(Math.random() * 4)],
        timestamp: new Date(),
      };
      setActivities((prev) => [newActivity, ...prev.slice(0, 7)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAcceptTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSkipTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast.info('Task skipped');
  };

  const handleCompleteTask = (taskId: string, reward: number) => {
    // Update earnings
    setStats((prev) => ({
      ...prev,
      totalEarnings: prev.totalEarnings + reward,
      tasksSolvedToday: prev.tasksSolvedToday + 1,
    }));

    // Remove completed task
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // Add to activity feed
    const newActivity: ActivityItem = {
      id: `a${Date.now()}`,
      username: 'You',
      amount: reward,
      taskType: selectedTask?.taskType || 'Task',
      timestamp: new Date(),
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 7)]);

    toast.success(`+$${reward.toFixed(2)} USDC earned!`);
  };

  const handleStartWorking = () => {
    setActiveTab('tasks');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            stats={stats} 
            activities={activities}
            onStartWorking={handleStartWorking}
          />
        );
      case 'tasks':
        return (
          <TaskStream 
            tasks={tasks}
            onAccept={handleAcceptTask}
            onSkip={handleSkipTask}
          />
        );
      case 'wallet':
        return (
          <WalletView 
            totalEarnings={stats.totalEarnings}
            transactions={mockTransactions}
          />
        );
      case 'profile':
        return <ProfileView stats={stats} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Web3 animated background */}
      <Web3Background />
      
      <Toaster position="top-center" richColors />
      
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Mobile Header */}
      <Header totalEarnings={stats.totalEarnings} />

      {/* Main Content - Responsive layout with proper spacing */}
      <main className="lg:ml-56 xl:ml-64 pb-20 sm:pb-24 lg:pb-8 min-h-screen">
        <div className="w-full max-w-[1600px] px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Work Mode Modal */}
      <WorkModeModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleCompleteTask}
      />
    </div>
  );
};

export default Index;