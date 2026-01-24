"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { TaskStream } from "@/components/tasks/TaskStream";
import { WorkModeModal } from "@/components/tasks/WorkModeModal";
import { Web3Background } from "@/components/ui/Web3Background";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { ensureUserStats } from "@/lib/auth";
import {
  mockTasks,
  mockUserStats,
  mockTransactions,
  mockActivityFeed,
} from "@/data/mockData";
import {
  fetchAgentTasks,
  fetchUserStats,
  fetchActivityFeed,
  subscribeToTasks,
  subscribeToActivityFeed,
  completeTask as completeTaskInDB,
  updateTaskStatus,
} from "@/lib/supabaseService";
import { Task, UserStats, ActivityItem } from "@/types";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Dynamic imports for components not needed on initial render
const WalletView = dynamic(
  () =>
    import("@/components/wallet/WalletView").then((mod) => ({
      default: mod.WalletView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">Loading...</div>
    ),
  },
);

const ProfileView = dynamic(
  () =>
    import("@/components/profile/ProfileView").then((mod) => ({
      default: mod.ProfileView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">Loading...</div>
    ),
  },
);

const CircleWalletManager = dynamic(
  () =>
    import("@/components/circle/CircleWalletManager")
      .then((mod) => ({ CircleWalletManager: mod.CircleWalletManager }))
      .then((mod) => ({ default: mod.CircleWalletManager })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        Loading wallet...
      </div>
    ),
  },
);

const TASK_STREAM_SIZE = 8;

export default function DashboardPage() {
  // All hooks must be at the top
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>(mockUserStats);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletCheckComplete, setWalletCheckComplete] = useState(false);

  // Task pool management
  const taskPoolRef = useRef<Task[]>([]);
  const usedTaskIdsRef = useRef<Set<string | number>>(new Set());
  const demoTaskIndexRef = useRef(0);
  const usingSupabaseTasksRef = useRef(false);

  // Get user from auth context or wallet
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const userId = user?.id || walletAddress || "demo-user-id";

  // Check for wallet connection on mount - verify it's actually connected
  useEffect(() => {
    const verifyWalletConnection = async () => {
      const storedAddress = localStorage.getItem("wallet_address");
      const storedConnected = localStorage.getItem("wallet_connected");

      if (storedConnected === "true" && storedAddress) {
        // Verify the wallet is still actually connected
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({
              method: "eth_accounts",
            });

            if (
              accounts &&
              accounts.length > 0 &&
              accounts[0].toLowerCase() === storedAddress.toLowerCase()
            ) {
              // Wallet is still connected
              setWalletConnected(true);
              setWalletAddress(storedAddress);
              console.log("Wallet verified and connected:", storedAddress);
            } else {
              // Wallet disconnected or changed, clear localStorage
              console.log("Wallet not connected, clearing localStorage");
              localStorage.removeItem("wallet_connected");
              localStorage.removeItem("wallet_address");
            }
          } catch (error) {
            console.error("Error verifying wallet:", error);
            localStorage.removeItem("wallet_connected");
            localStorage.removeItem("wallet_address");
          }
        }
      }

      setWalletCheckComplete(true);
    };

    verifyWalletConnection();
  }, []);

  // Redirect to wallet connection if not authenticated
  useEffect(() => {
    if (walletCheckComplete && !authLoading && !user && !walletConnected) {
      console.log("No authentication found, redirecting to wallet connection");
      router.push("/connect-wallet");
    }
  }, [walletCheckComplete, authLoading, user, walletConnected, router]);

  // Initialize user stats on mount
  useEffect(() => {
    const initUserStats = async () => {
      if (user?.id) {
        try {
          await ensureUserStats(user.id);
        } catch (error) {
          console.error("Failed to initialize user stats:", error);
        }
      }
    };
    initUserStats();
  }, [user?.id]);

  // Callback functions that don't use hooks
  const getNextTask = useCallback((): Task | null => {
    // First, try to get from Supabase pool
    const availableSupabaseTasks = taskPoolRef.current.filter(
      (task) => !usedTaskIdsRef.current.has(task.id),
    );

    if (availableSupabaseTasks.length > 0) {
      const task = availableSupabaseTasks[0];
      usedTaskIdsRef.current.add(task.id);
      return task;
    }

    // If no Supabase tasks, use demo tasks
    const demoTask = mockTasks[demoTaskIndexRef.current % mockTasks.length];
    const uniqueTask = {
      ...demoTask,
      id: Date.now() + demoTaskIndexRef.current,
    };
    demoTaskIndexRef.current++;
    return uniqueTask;
  }, []);

  // Initialize task stream with initial tasks
  const initializeTaskStream = useCallback(() => {
    const initialTasks: Task[] = [];
    // Start with 3-4 tasks initially
    for (let i = 0; i < 4; i++) {
      const task = getNextTask();
      if (task) initialTasks.push(task);
    }
    setTasks(initialTasks);
  }, [getNextTask]);

  // Initial data fetch from Supabase
  useEffect(() => {
    if (!user && !walletConnected) return; // Don't load if not authenticated

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch tasks, stats, and activities in parallel
        const [tasksData, statsData, activitiesData] = await Promise.all([
          fetchAgentTasks(),
          fetchUserStats(userId),
          fetchActivityFeed(10),
        ]);

        // Setup task pool
        if (tasksData.length > 0) {
          taskPoolRef.current = tasksData;
          usingSupabaseTasksRef.current = true;
        } else {
          taskPoolRef.current = [];
          usingSupabaseTasksRef.current = false;
        }

        // Initialize exactly 8 tasks
        initializeTaskStream();

        // Set stats and activities
        setStats(statsData || mockUserStats);
        setActivities(
          activitiesData.length > 0 ? activitiesData : mockActivityFeed,
        );
      } catch (error) {
        console.error("Error loading initial data:", error);
        // Fallback to demo tasks on error
        taskPoolRef.current = [];
        usingSupabaseTasksRef.current = false;
        initializeTaskStream();
        setStats(mockUserStats);
        setActivities(mockActivityFeed);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [userId, user, walletConnected, initializeTaskStream]);

  // Add new task every 30 seconds
  useEffect(() => {
    if (!user && !walletConnected) return; // Don't run if not authenticated

    const interval = setInterval(() => {
      const newTask = getNextTask();
      if (newTask) {
        setTasks((prev) => [...prev, newTask]);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, walletConnected, getNextTask]);

  // Real-time subscriptions for tasks and activity feed
  useEffect(() => {
    if (!user && !walletConnected) return; // Don't subscribe if not authenticated

    // Subscribe to task updates
    const taskSubscription = subscribeToTasks((payload) => {
      if (payload.eventType === "INSERT") {
        // Add new task to pool (not to display, pool only)
        taskPoolRef.current = [payload.new, ...taskPoolRef.current];
        toast.info("New task available in pool!");
      } else if (payload.eventType === "UPDATE") {
        // Update task in pool
        taskPoolRef.current = taskPoolRef.current.map((task) =>
          task.id === payload.new.id ? payload.new : task,
        );
        // Update in display if present
        setTasks((prev) =>
          prev.map((task) => (task.id === payload.new.id ? payload.new : task)),
        );
      } else if (payload.eventType === "DELETE") {
        // Remove from pool
        taskPoolRef.current = taskPoolRef.current.filter(
          (task) => task.id !== payload.old.id,
        );
        // Remove from display if present
        setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
      }
    });

    // Subscribe to activity feed updates
    const activitySubscription = subscribeToActivityFeed((payload) => {
      if (payload.eventType === "INSERT") {
        setActivities((prev) => [payload.new, ...prev.slice(0, 9)]);
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      taskSubscription.unsubscribe();
      activitySubscription.unsubscribe();
    };
  }, []);

  const handleAcceptTask = useCallback(
    async (task: Task) => {
      setSelectedTask(task);
      setIsModalOpen(true);

      // Update task status in Supabase
      await updateTaskStatus(task.id, "accepted", userId);
    },
    [userId],
  );

  const handleSkipTask = useCallback(
    async (taskId: string | number) => {
      // Remove skipped task without replacing
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      toast.info("Task skipped");

      // Update task status in Supabase (only for real Supabase tasks)
      if (typeof taskId === "number") {
        await updateTaskStatus(taskId, "skipped", userId);
      }
    },
    [userId],
  );

  const handleTaskTimeout = useCallback(
    async (taskId: string | number) => {
      // Remove expired task without replacing
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      // Update task status in Supabase (only for real Supabase tasks)
      if (typeof taskId === "number") {
        await updateTaskStatus(taskId, "skipped", userId);
      }
    },
    [userId],
  );

  const handleCompleteTask = useCallback(
    async (taskId: string | number, reward: number) => {
      try {
        // Ensure reward is a valid number
        const validReward = Number(reward) || 0;

        // Update task in Supabase (only for real Supabase tasks)
        let success = true;
        if (typeof taskId === "number") {
          success = await completeTaskInDB(taskId, userId, validReward);
        }

        if (success) {
          // Update local state
          setStats((prev) => ({
            ...prev,
            totalEarnings: prev.totalEarnings + validReward,
            tasksSolvedToday: prev.tasksSolvedToday + 1,
          }));

          // Remove completed task without replacing
          setTasks((prev) => prev.filter((t) => t.id !== taskId));

          // Add to activity feed
          const newActivity: ActivityItem = {
            id: `a${Date.now()}`,
            username: "You",
            amount: validReward,
            taskType: selectedTask?.taskType || "Task",
            timestamp: new Date(),
          };
          setActivities((prev) => [newActivity, ...prev.slice(0, 7)]);

          toast.success(`+$${validReward.toFixed(2)} USDC earned!`);
        } else {
          toast.error("Failed to complete task. Please try again.");
        }
      } catch (error) {
        console.error("Error completing task:", error);
        toast.error("An error occurred. Please try again.");
      }
    },
    [userId, selectedTask],
  );

  const handleStartWorking = useCallback(() => {
    setActiveTab("tasks");
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            stats={stats}
            activities={activities}
            onStartWorking={handleStartWorking}
          />
        );
      case "tasks":
        return (
          <TaskStream
            tasks={tasks}
            onAccept={handleAcceptTask}
            onSkip={handleSkipTask}
            onTimeout={handleTaskTimeout}
          />
        );
      case "wallet":
        return (
          <div className="space-y-6">
            <CircleWalletManager userId={userId} />
            <WalletView
              totalEarnings={stats.totalEarnings}
              transactions={mockTransactions}
            />
          </div>
        );
      case "profile":
        return <ProfileView stats={stats} />;
      default:
        return null;
    }
  };

  // Show login form if not authenticated (AFTER all hooks)
  if (authLoading || !walletCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // This check is now handled by the redirect useEffect above
  // But kept as a fallback
  if (!user && !walletConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-white text-xl">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Web3 animated background */}
      <Web3Background />

      <Toaster position="top-center" richColors />

      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Mobile Header */}
      <Header totalEarnings={stats?.totalEarnings || 0} />

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
}
