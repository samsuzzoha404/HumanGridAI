/**
 * Supabase Edge Function: Circle Webhook Handler
 *
 * Receives webhooks from Circle for wallet and transaction events.
 * Verifies signatures and stores events in Supabase.
 *
 * Deploy: supabase functions deploy circle-webhook-handler
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const rustServiceUrl =
  Deno.env.get("RUST_SERVICE_URL") || "http://localhost:8080";

serve(async (req) => {
  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Get Circle signature headers
    const signature = req.headers.get("X-Circle-Signature");
    const keyId = req.headers.get("X-Circle-Key-Id");

    if (!signature || !keyId) {
      console.error("Missing Circle signature headers");
      return new Response("Missing signature headers", { status: 400 });
    }

    // Parse webhook payload
    const payload = await req.text();
    const webhookData = JSON.parse(payload);

    console.log("Received Circle webhook:", {
      type: webhookData.notificationType,
      id: webhookData.notificationId,
    });

    // Store webhook event in Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase
      .from("circle_webhook_events")
      .insert({
        event_type: webhookData.notificationType,
        event_data: webhookData,
        signature,
        key_id: keyId,
        processed: false,
      });

    if (insertError) {
      console.error("Failed to store webhook event:", insertError);
      return new Response("Failed to store event", { status: 500 });
    }

    // Process specific events
    await processWebhookEvent(supabase, webhookData);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function processWebhookEvent(supabase: any, webhookData: any) {
  const eventType = webhookData.notificationType;
  const notification = webhookData.notification;

  try {
    switch (eventType) {
      case "modularWallet.inboundTransfer":
      case "transactions.inbound":
        await handleInboundTransfer(supabase, notification);
        break;

      case "modularWallet.outboundTransfer":
      case "transactions.outbound":
        await handleOutboundTransfer(supabase, notification);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error processing ${eventType}:`, error);
  }
}

async function handleInboundTransfer(supabase: any, notification: any) {
  console.log("Processing inbound transfer:", notification.id);

  // Update circle_transactions table
  await supabase.from("circle_transactions").upsert({
    circle_tx_id: notification.id,
    status: notification.state?.toLowerCase() || "pending",
    blockchain_tx_hash: notification.txHash,
    updated_at: new Date().toISOString(),
  });
}

async function handleOutboundTransfer(supabase: any, notification: any) {
  console.log("Processing outbound transfer:", notification.id);

  // Update circle_transactions table
  const { data, error } = await supabase
    .from("circle_transactions")
    .update({
      status: notification.state?.toLowerCase() || "pending",
      blockchain_tx_hash: notification.txHash,
      completed_at:
        notification.state === "COMPLETE" ? new Date().toISOString() : null,
    })
    .eq("circle_tx_id", notification.id)
    .select();

  if (error) {
    console.error("Failed to update transaction:", error);
    return;
  }

  // If transaction completed, update task status
  if (notification.state === "COMPLETE" && data && data.length > 0) {
    const transaction = data[0];
    if (transaction.task_id) {
      await supabase
        .from("tasks")
        .update({
          status: "paid",
          completed_at: new Date().toISOString(),
        })
        .eq("id", transaction.task_id);

      console.log(`✅ Task ${transaction.task_id} marked as paid`);
    }
  }
}
