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

/**
 * Verify Circle webhook signature using Rust service
 * CRITICAL: Prevents forged webhooks from attackers
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  keyId: string,
  rustUrl: string,
): Promise<boolean> {
  try {
    const response = await fetch(`${rustUrl}/api/circle/verify-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, signature, key_id: keyId }),
    });
    const result = await response.json();
    return result.valid === true;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

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

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // CRITICAL: Verify webhook signature before processing
    const isValid = await verifyWebhookSignature(
      payload,
      signature,
      keyId,
      rustServiceUrl,
    );

    if (!isValid) {
      console.error("❌ Invalid webhook signature - possible attack");
      return new Response("Invalid signature", { status: 403 });
    }

    console.log("✅ Webhook signature verified");

    // Idempotency check: prevent duplicate processing
    const { data: existing } = await supabase
      .from("circle_webhook_events")
      .select("id, processed")
      .eq("notification_id", webhookData.notificationId)
      .single();

    if (existing) {
      if (existing.processed) {
        console.log(
          `⚠️ Webhook ${webhookData.notificationId} already processed - skipping`,
        );
        return new Response(
          JSON.stringify({ success: true, duplicate: true }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      // Mark as being processed
      console.log(`Reprocessing failed webhook ${webhookData.notificationId}`);
    }

    // Store webhook event in Supabase (upsert for idempotency)
    const { error: insertError } = await supabase
      .from("circle_webhook_events")
      .upsert(
        {
          notification_id: webhookData.notificationId,
          event_type: webhookData.notificationType,
          event_data: webhookData,
          signature,
          key_id: keyId,
          processed: false,
          received_at: new Date().toISOString(),
        },
        { onConflict: "notification_id" },
      );

    if (insertError) {
      console.error("Failed to store webhook event:", insertError);
      return new Response("Failed to store event", { status: 500 });
    }

    // Process specific events
    await processWebhookEvent(supabase, webhookData);

    // Mark webhook as processed
    await supabase
      .from("circle_webhook_events")
      .update({ processed: true })
      .eq("notification_id", webhookData.notificationId);

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

  // Update circle_transactions table (idempotent)
  await supabase.from("circle_transactions").upsert(
    {
      circle_tx_id: notification.id,
      status: notification.state?.toLowerCase() || "pending",
      blockchain_tx_hash: notification.txHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "circle_tx_id" },
  );
}

async function handleOutboundTransfer(supabase: any, notification: any) {
  console.log("Processing outbound transfer:", notification.id);

  // Upsert transaction status (idempotent)
  const { data, error } = await supabase
    .from("circle_transactions")
    .upsert(
      {
        circle_tx_id: notification.id,
        status: notification.state?.toLowerCase() || "pending",
        blockchain_tx_hash: notification.txHash,
        completed_at:
          notification.state === "COMPLETE" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "circle_tx_id" },
    )
    .select();

  if (error) {
    console.error("Failed to upsert transaction:", error);
    throw error; // Fail loudly - webhook will retry
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
