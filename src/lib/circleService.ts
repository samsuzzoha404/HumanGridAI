import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const rustServiceUrl =
  process.env.NEXT_PUBLIC_RUST_SERVICE_URL || "http://localhost:8080";

export interface CircleWallet {
  id: string;
  user_id: string;
  circle_wallet_id: string;
  wallet_address: string | null;
  blockchain: string;
  state: string;
  created_at: string;
}

export interface CircleTransaction {
  id: string;
  circle_tx_id: string;
  task_id: string | null;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  token_symbol: string;
  status: string;
  blockchain_tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Create a Circle wallet for the current user
 */
export async function createCircleWallet(
  userId: string
): Promise<CircleWallet> {
  const response = await fetch(`${rustServiceUrl}/api/circle/create-wallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      blockchain: "ARC-TESTNET",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create wallet: ${error}`);
  }

  const data = await response.json();

  // Store wallet in Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.from("circle_wallets").insert({
    user_id: userId,
    circle_wallet_id: data.wallet_id,
    wallet_address: data.wallet_address,
    blockchain: data.blockchain,
    state: "ACTIVE",
  });

  if (error) {
    console.error("Failed to store wallet in Supabase:", error);
  }

  return data;
}

/**
 * Get user's Circle wallet
 */
export async function getUserCircleWallet(
  userId: string
): Promise<CircleWallet | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("circle_wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get wallet balance (USDC)
 */
export async function getWalletBalance(walletId: string): Promise<number> {
  const response = await fetch(
    `${rustServiceUrl}/api/circle/balance/${walletId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch balance");
  }

  const data = await response.json();
  return parseFloat(data.usdc_balance);
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(
  walletId: string
): Promise<CircleTransaction[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("circle_transactions")
    .select("*")
    .or(`from_wallet.eq.${walletId},to_wallet.eq.${walletId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }

  return data || [];
}

/**
 * Initiate payment to worker (called by Rust service internally)
 */
export async function payWorker(
  workerWalletId: string,
  amount: string,
  taskId: string
): Promise<any> {
  const response = await fetch(`${rustServiceUrl}/api/circle/pay-worker`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      worker_wallet_id: workerWalletId,
      amount,
      task_id: taskId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to initiate payment: ${error}`);
  }

  return response.json();
}

/**
 * Get transfer status
 */
export async function getTransferStatus(transferId: string): Promise<any> {
  const response = await fetch(
    `${rustServiceUrl}/api/circle/transfer-status/${transferId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transfer status");
  }

  return response.json();
}
