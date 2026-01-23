// API client for Rust service
const RUST_SERVICE_URL =
  process.env.NEXT_PUBLIC_RUST_SERVICE_URL || "http://localhost:8081";

interface CreateTaskRequest {
  bot_name: string;
  bot_version?: string;
  task_type: string;
  task_description: string;
  reward_amount: number;
  difficulty?: string;
  time_remaining?: number;
  image_url?: string;
}

interface TaskResponse {
  id: number;
  bot_name: string;
  bot_version?: string;
  task_type: string;
  task_description: string;
  reward_amount: number;
  difficulty?: string;
  time_remaining?: number;
  image_url?: string;
  status: string;
  created_at: string;
}

interface VerifyTaskRequest {
  task_id: string;
  user_id: string;
  submission: string;
  metadata?: Record<string, any>;
}

interface VerifyTaskResponse {
  success: boolean;
  confidence: number;
  message: string;
  fraud_detected: boolean;
}

interface PayWorkerRequest {
  worker_wallet_id: string;
  amount_usdc: string;
  task_id: string;
}

interface PayWorkerResponse {
  transfer_id: string;
  status: string;
  amount: string;
  message: string;
}

/**
 * Create a new task (for AI agents)
 */
export async function createTask(
  task: CreateTaskRequest,
): Promise<TaskResponse> {
  const response = await fetch(`${RUST_SERVICE_URL}/api/tasks/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create task: ${error}`);
  }

  return response.json();
}

/**
 * Verify task submission with fraud detection
 */
export async function verifyTask(
  request: VerifyTaskRequest,
): Promise<VerifyTaskResponse> {
  const response = await fetch(`${RUST_SERVICE_URL}/api/verify-task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to verify task: ${error}`);
  }

  return response.json();
}

/**
 * Pay worker via Circle USDC
 */
export async function payWorker(
  request: PayWorkerRequest,
): Promise<PayWorkerResponse> {
  const response = await fetch(`${RUST_SERVICE_URL}/api/circle/pay-worker`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to pay worker: ${error}`);
  }

  return response.json();
}

/**
 * Get worker reputation stats
 */
export async function getWorkerStats(address: string) {
  const response = await fetch(
    `${RUST_SERVICE_URL}/api/worker-stats/${address}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get worker stats: ${error}`);
  }

  return response.json();
}

/**
 * Check backend health
 */
export async function checkHealth() {
  const response = await fetch(`${RUST_SERVICE_URL}/health`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Backend service is not healthy");
  }

  return response.json();
}

/**
 * Get Circle wallet balance
 */
export async function getCircleBalance(walletId: string) {
  const response = await fetch(
    `${RUST_SERVICE_URL}/api/circle/balance/${walletId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get balance: ${error}`);
  }

  return response.json();
}

/**
 * Create Circle wallet for user
 */
export async function createCircleWallet(userId: string) {
  const response = await fetch(`${RUST_SERVICE_URL}/api/circle/create-wallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      blockchain: "BASE-SEPOLIA",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create wallet: ${error}`);
  }

  return response.json();
}

/**
 * Get transfer status
 */
export async function getTransferStatus(transferId: string) {
  const response = await fetch(
    `${RUST_SERVICE_URL}/api/circle/transfer-status/${transferId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get transfer status: ${error}`);
  }

  return response.json();
}

/**
 * Authenticate wallet with backend
 */
export async function authenticateWallet(
  walletAddress: string,
  signature?: string,
  message?: string,
) {
  const response = await fetch(`${RUST_SERVICE_URL}/api/wallet/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      wallet_address: walletAddress,
      signature,
      message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to authenticate wallet: ${error}`);
  }

  return response.json();
}

/**
 * Link Circle wallet to user
 */
export async function linkCircleWallet(userId: string, walletAddress: string) {
  const response = await fetch(`${RUST_SERVICE_URL}/api/wallet/link-circle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      wallet_address: walletAddress,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to link Circle wallet: ${error}`);
  }

  return response.json();
}

/**
 * Get user wallet info
 */
export async function getUserWallet(userId: string) {
  const response = await fetch(`${RUST_SERVICE_URL}/api/wallet/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user wallet: ${error}`);
  }

  return response.json();
}
