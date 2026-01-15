import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Task, UserStats, ActivityItem, Transaction } from '@/types';

/**
 * Enrich Supabase task with UI-only fields like timeRemaining, taskType, etc.
 */
function enrichTaskWithUIFields(task: Task): Task {
  // Generate random timeRemaining between 18-55 seconds
  const timeOptions = [18, 20, 22, 24, 25, 28, 30, 32, 35, 40, 45, 50, 55];
  const randomTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];
  
  // Generate task type based on description keywords
  let taskType: 'captcha' | 'sentiment' | 'labeling' | 'verification' = 'verification';
  const description = task.task_description.toLowerCase();
  if (description.includes('captcha') || description.includes('verify human') || description.includes('puzzle')) {
    taskType = 'captcha';
  } else if (description.includes('sentiment') || description.includes('emotion') || description.includes('feeling')) {
    taskType = 'sentiment';
  } else if (description.includes('label') || description.includes('tag') || description.includes('classify')) {
    taskType = 'labeling';
  }
  
  // Determine difficulty based on reward amount
  let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  if (task.reward_amount >= 0.12) {
    difficulty = 'hard';
  } else if (task.reward_amount >= 0.08) {
    difficulty = 'medium';
  }
  
  const enriched = {
    ...task,
    timeRemaining: randomTime,
    taskType,
    difficulty,
    botVersion: `v${Math.floor(Math.random() * 4) + 1}.${Math.floor(Math.random() * 10)}`,
  };
  
  return enriched;
}

/**
 * Fetch all available agent tasks from Supabase
 */
export async function fetchAgentTasks(): Promise<Task[]> {
  if (!supabase) {
    return []; // Return empty array if Supabase not configured
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message && error.message !== '{}') {
        console.warn('Tasks fetch skipped:', error.message);
      }
      return [];
    }

    // Enrich tasks with UI fields
    const enrichedTasks = (data || []).map(enrichTaskWithUIFields);
    return enrichedTasks;
  } catch (error) {
    return [];
  }
}

/**
 * Fetch user statistics from Supabase
 */
export async function fetchUserStats(userId: string): Promise<UserStats | null> {
  if (!supabase) {
    return null; // Return null if Supabase not configured
  }

  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch recent activity feed
 */
export async function fetchActivityFeed(limit: number = 10): Promise<ActivityItem[]> {
  if (!supabase) {
    return []; // Return empty array if Supabase not configured
  }

  try {
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Update task status (accept, complete, skip)
 */
export async function updateTaskStatus(
  taskId: string | number,
  status: 'pending' | 'accepted' | 'completed' | 'skipped',
  userId?: string
): Promise<boolean> {
  // Skip Supabase update for demo tasks (string IDs)
  if (typeof taskId === 'string') {
    return true;
  }

  // Check if Supabase is configured
  if (!supabase) {
    return true; // Gracefully skip if Supabase not configured
  }

  try {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status,
        ...(userId && { assigned_to: userId })
      })
      .eq('id', taskId);

    if (error) {
      // Only log meaningful errors
      if (error.message && error.message !== '{}') {
        console.warn('Supabase task update failed (using local state):', error.message);
      }
      return true; // Return true to continue with local state updates
    }

    return true;
  } catch (error) {
    console.warn('Task status update skipped (Supabase unavailable):', error instanceof Error ? error.message : 'Unknown error');
    return true; // Continue with local state
  }
}

/**
 * Complete a task and update user earnings
 */
export async function completeTask(
  taskId: string | number,
  userId: string,
  reward: number
): Promise<boolean> {
  // Skip Supabase operations for demo tasks or if not configured
  if (typeof taskId === 'string' || !supabase) {
    return true; // Continue with local state
  }

  try {
    // 1. Update task status
    await updateTaskStatus(taskId, 'completed', userId);

    // 2. Update user stats (if RPC function exists)
    const { error: statsError } = await supabase.rpc('increment_user_earnings', {
      p_user_id: userId,
      p_amount: reward,
    });

    if (statsError && statsError.message && statsError.message !== '{}') {
      console.warn('User stats update skipped:', statsError.message);
    }

    // 3. Create activity record
    const { error: activityError } = await supabase
      .from('activity_feed')
      .insert({
        user_id: userId,
        task_id: taskId,
        amount: reward,
        timestamp: new Date().toISOString(),
      });

    if (activityError && activityError.message && activityError.message !== '{}') {
      console.warn('Activity record creation skipped:', activityError.message);
    }

    return true;
  } catch (error) {
    console.warn('Task completion recorded locally only:', error instanceof Error ? error.message : 'Unknown error');
    return true; // Continue with local state
  }
}

/**
 * Subscribe to real-time task updates
 */
export function subscribeToTasks(
  callback: (payload: any) => void
) {
  if (!supabase) {
    // Return a mock subscription if Supabase not configured
    return {
      unsubscribe: () => {},
      subscribe: () => {},
    } as any;
  }

  const subscription = supabase
    .channel('tasks-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
      },
      (payload) => {
        // Enrich the task with UI fields if it's INSERT or UPDATE
        const enrichedPayload = {
          ...payload,
          new: payload.new ? enrichTaskWithUIFields(payload.new) : payload.new,
        };
        callback(enrichedPayload);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Subscribe to real-time activity feed updates
 */
export function subscribeToActivityFeed(
  callback: (payload: any) => void
) {
  if (!supabase) {
    // Return a mock subscription if Supabase not configured
    return {
      unsubscribe: () => {},
      subscribe: () => {},
    } as any;
  }

  const subscription = supabase
    .channel('activity-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed',
      },
      callback
    )
    .subscribe();

  return subscription;
}

/**
 * Fetch user transactions
 */
export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
}
