/**
 * Blockchain Event Listener Service
 *
 * This service listens to events from the HumanGridEscrow and ReputationSBT
 * contracts and syncs them to Supabase for real-time UI updates.
 *
 * This is the bridge between on-chain truth and off-chain display.
 */

import { supabase } from "./supabaseClient";
import { watchTaskCompleted, watchReputationMinted } from "./blockchain";

let taskCompletedUnwatch: (() => void) | null = null;
let reputationMintedUnwatch: (() => void) | null = null;

/**
 * Start listening to blockchain events
 */
export function startEventListeners() {
  console.log("🎧 Starting blockchain event listeners...");

  // Listen for TaskCompleted events
  taskCompletedUnwatch = watchTaskCompleted(async (event) => {
    console.log("✅ TaskCompleted event:", event);

    try {
      // Update task status in Supabase
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "paid",
          completed_at: new Date(
            Number(event.completedAt) * 1000
          ).toISOString(),
          payment_tx_hash: event.taskId, // In production, get actual tx hash
        })
        .eq("task_id", event.taskId);

      if (error) {
        console.error("Failed to update task in Supabase:", error);
      } else {
        console.log("✅ Task updated in Supabase:", event.taskId);
      }

      // Update worker earnings
      await updateWorkerEarnings(event.worker, event.amount);
    } catch (error) {
      console.error("Error processing TaskCompleted event:", error);
    }
  });

  // Listen for ReputationMinted events
  reputationMintedUnwatch = watchReputationMinted(async (event) => {
    console.log("🏆 ReputationMinted event:", event);

    try {
      // Update worker reputation in Supabase
      const { error } = await supabase.from("workers").upsert(
        {
          address: event.worker.toLowerCase(),
          reputation_tier: event.tier,
          reputation_updated_at: new Date(
            Number(event.timestamp) * 1000
          ).toISOString(),
        },
        {
          onConflict: "address",
        }
      );

      if (error) {
        console.error("Failed to update reputation in Supabase:", error);
      } else {
        console.log("✅ Reputation updated in Supabase:", event.worker);
      }
    } catch (error) {
      console.error("Error processing ReputationMinted event:", error);
    }
  });

  console.log("✅ Event listeners started");
}

/**
 * Stop listening to blockchain events
 */
export function stopEventListeners() {
  console.log("🛑 Stopping blockchain event listeners...");

  if (taskCompletedUnwatch) {
    taskCompletedUnwatch();
    taskCompletedUnwatch = null;
  }

  if (reputationMintedUnwatch) {
    reputationMintedUnwatch();
    reputationMintedUnwatch = null;
  }

  console.log("✅ Event listeners stopped");
}

/**
 * Update worker's total earnings
 */
async function updateWorkerEarnings(worker: string, amount: bigint) {
  try {
    // Get current earnings
    const { data, error: fetchError } = await supabase
      .from("workers")
      .select("total_earnings")
      .eq("address", worker.toLowerCase())
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    const currentEarnings = BigInt(data?.total_earnings || 0);
    const newEarnings = currentEarnings + amount;

    // Update earnings
    const { error: updateError } = await supabase.from("workers").upsert(
      {
        address: worker.toLowerCase(),
        total_earnings: newEarnings.toString(),
      },
      {
        onConflict: "address",
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Updated earnings for ${worker}: ${newEarnings}`);
  } catch (error) {
    console.error("Error updating worker earnings:", error);
  }
}

/**
 * Sync historical events (one-time sync on startup)
 */
export async function syncHistoricalEvents() {
  console.log("📜 Syncing historical events from blockchain...");

  // In production, this would:
  // 1. Query past events from blockchain
  // 2. Compare with Supabase data
  // 3. Fill in any gaps
  // 4. Update missing records

  // For now, we'll skip this as it requires indexing setup
  console.log("⏭️  Historical sync skipped (implement with event indexer)");
}
