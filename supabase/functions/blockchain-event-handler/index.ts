/**
 * Supabase Edge Function: Blockchain Event Handler
 *
 * This function receives webhook notifications from a blockchain indexer
 * (like Alchemy, QuickNode, or a custom indexer) and processes events
 * from the HumanGridEscrow and ReputationSBT contracts.
 *
 * Deploy this to Supabase Edge Functions:
 * supabase functions deploy blockchain-event-handler
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const {
      event_type,
      contract_address,
      transaction_hash,
      block_number,
      log_index,
      data,
    } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store event in blockchain_events table
    const { error: eventError } = await supabase
      .from("blockchain_events")
      .insert({
        event_type,
        contract_address,
        block_number,
        transaction_hash,
        log_index,
        event_data: data,
        processed: false,
      });

    if (eventError) {
      console.error("Failed to store event:", eventError);
      return new Response(JSON.stringify({ error: "Failed to store event" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Process event based on type
    switch (event_type) {
      case "TaskCompleted":
        await handleTaskCompleted(supabase, data);
        break;
      case "ReputationMinted":
        await handleReputationMinted(supabase, data);
        break;
      case "ReputationUpgraded":
        await handleReputationUpgraded(supabase, data);
        break;
      default:
        console.log(`Unknown event type: ${event_type}`);
    }

    // Mark event as processed
    await supabase
      .from("blockchain_events")
      .update({ processed: true })
      .eq("transaction_hash", transaction_hash)
      .eq("log_index", log_index);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing event:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function handleTaskCompleted(supabase: any, data: any) {
  const { taskId, worker, amount, completedAt } = data;

  // Update task status
  await supabase
    .from("tasks")
    .update({
      status: "paid",
      completed_at: new Date(Number(completedAt) * 1000).toISOString(),
    })
    .eq("task_id", taskId);

  // Update worker earnings
  const { data: workerData } = await supabase
    .from("workers")
    .select("total_earnings, completed_tasks")
    .eq("address", worker.toLowerCase())
    .single();

  const currentEarnings = BigInt(workerData?.total_earnings || "0");
  const newEarnings = currentEarnings + BigInt(amount);

  await supabase.from("workers").upsert(
    {
      address: worker.toLowerCase(),
      total_earnings: newEarnings.toString(),
      completed_tasks: (workerData?.completed_tasks || 0) + 1,
    },
    {
      onConflict: "address",
    }
  );

  console.log(`✅ Task ${taskId} marked as paid`);
}

async function handleReputationMinted(supabase: any, data: any) {
  const { worker, tier, timestamp } = data;

  await supabase.from("workers").upsert(
    {
      address: worker.toLowerCase(),
      reputation_tier: tier,
      reputation_updated_at: new Date(Number(timestamp) * 1000).toISOString(),
    },
    {
      onConflict: "address",
    }
  );

  console.log(`🏆 Reputation minted for ${worker}: Tier ${tier}`);
}

async function handleReputationUpgraded(supabase: any, data: any) {
  const { worker, oldTier, newTier } = data;

  await supabase
    .from("workers")
    .update({
      reputation_tier: newTier,
      reputation_updated_at: new Date().toISOString(),
    })
    .eq("address", worker.toLowerCase());

  console.log(`⬆️ Reputation upgraded for ${worker}: ${oldTier} → ${newTier}`);
}
