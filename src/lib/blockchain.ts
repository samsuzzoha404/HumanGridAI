/**
 * Blockchain Integration Layer
 *
 * This module provides utilities for interacting with the smart contracts
 * deployed in Phase 1. It uses viem for type-safe contract interactions.
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  parseAbi,
  http,
  defineChain,
} from "viem";

// Arc Testnet configuration
const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// Contract addresses from Arc Testnet deployment
const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`;
const REPUTATION_ADDRESS = process.env
  .NEXT_PUBLIC_REPUTATION_ADDRESS as `0x${string}`;

// Arc uses native USDC - no contract address needed
const chain = arcTestnet;

// RPC URL from Alchemy
const RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;

// ABIs for Arc Testnet contracts
const escrowAbi = parseAbi([
  "function createTask(bytes32 taskId, address worker) external payable",
  "function getTask(bytes32 taskId) external view returns (address requester, address worker, uint256 amount, uint256 createdAt, bool completed, bool cancelled)",
  "function isTaskActive(bytes32 taskId) external view returns (bool)",
  "event TaskCreated(bytes32 indexed taskId, address indexed requester, address indexed worker, uint256 amount, uint256 createdAt)",
  "event TaskCompleted(bytes32 indexed taskId, address indexed worker, uint256 amount, uint256 completedAt)",
  "event TaskCancelled(bytes32 indexed taskId, address indexed requester, uint256 refundAmount, uint256 cancelledAt)",
]);

const reputationAbi = parseAbi([
  "function getTier(address worker) external view returns (uint8)",
  "function hasReputation(address worker) external view returns (bool)",
  "function getTierName(uint8 tier) external pure returns (string)",
  "event ReputationMinted(address indexed worker, uint8 tier, uint256 timestamp)",
  "event ReputationUpgraded(address indexed worker, uint8 oldTier, uint8 newTier)",
]);

// No USDC ABI needed - Arc uses native USDC

/**
 * Get public client for reading blockchain state
 */
export function getPublicClient() {
  return createPublicClient({
    chain,
    transport: http(RPC_URL),
  });
}

/**
 * Get wallet client for writing transactions (requires browser wallet)
 */
export function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet detected");
  }

  return createWalletClient({
    chain,
    transport: custom(window.ethereum),
  });
}

/**
 * Create a task and deposit native USDC to escrow
 * @param taskId Unique task identifier
 * @param worker Worker address
 * @param amount Amount in native USDC (18 decimals)
 */
export async function createTask(
  taskId: string,
  worker: `0x${string}`,
  amount: bigint,
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  // No approval needed - native USDC sent as msg.value

  // Create task with native USDC\n  const taskIdBytes = taskId as `0x${string}`;\n  const hash = await walletClient.writeContract({\n    address: ESCROW_ADDRESS,\n    abi: escrowAbi,\n    functionName: \"createTask\",\n    args: [taskIdBytes, worker],\n    value: amount,  // Send native USDC as value\n    account,\n  });

  return hash;
}

/**
 * Get task details from blockchain
 */
export async function getTask(taskId: string) {
  const publicClient = getPublicClient();
  const taskIdBytes = taskId as `0x${string}`;

  const result = await publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "getTask",
    args: [taskIdBytes],
  });

  return {
    requester: result[0],
    worker: result[1],
    amount: result[2],
    createdAt: result[3],
    completed: result[4],
    cancelled: result[5],
  };
}

/**
 * Check if task is active
 */
export async function isTaskActive(taskId: string): Promise<boolean> {
  const publicClient = getPublicClient();
  const taskIdBytes = taskId as `0x${string}`;

  return publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "isTaskActive",
    args: [taskIdBytes],
  });
}

/**
 * Get worker's reputation tier
 */
export async function getReputationTier(
  worker: `0x${string}`,
): Promise<number> {
  const publicClient = getPublicClient();

  return publicClient.readContract({
    address: REPUTATION_ADDRESS,
    abi: reputationAbi,
    functionName: "getTier",
    args: [worker],
  });
}

/**
 * Get worker's reputation tier name
 */
export async function getReputationTierName(tier: number): Promise<string> {
  const publicClient = getPublicClient();

  return publicClient.readContract({
    address: REPUTATION_ADDRESS,
    abi: reputationAbi,
    functionName: "getTierName",
    args: [tier],
  });
}

/**
 * Check if worker has reputation
 */
export async function hasReputation(worker: `0x${string}`): Promise<boolean> {
  const publicClient = getPublicClient();

  return publicClient.readContract({
    address: REPUTATION_ADDRESS,
    abi: reputationAbi,
    functionName: "hasReputation",
    args: [worker],
  });
}

/**
 * Get native USDC balance on Arc Testnet
 */
export async function getUsdcBalance(account: `0x${string}`): Promise<bigint> {
  console.log("🔗 [blockchain.ts] Getting USDC balance for:", account);
  const publicClient = getPublicClient();
  console.log("📡 [blockchain.ts] Public client created, fetching balance...");

  // On Arc, USDC is the native currency
  const balance = await publicClient.getBalance({ address: account });
  console.log("✅ [blockchain.ts] Balance fetched:", balance.toString(), "wei");
  return balance;
}

/**
 * Watch for TaskCompleted events
 */
export function watchTaskCompleted(
  onTaskCompleted: (log: {
    taskId: string;
    worker: string;
    amount: bigint;
    completedAt: bigint;
  }) => void,
) {
  const publicClient = getPublicClient();

  return publicClient.watchContractEvent({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    eventName: "TaskCompleted",
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (
          log.args.taskId &&
          log.args.worker &&
          log.args.amount &&
          log.args.completedAt
        ) {
          onTaskCompleted({
            taskId: log.args.taskId,
            worker: log.args.worker,
            amount: log.args.amount,
            completedAt: log.args.completedAt,
          });
        }
      });
    },
  });
}

/**
 * Watch for ReputationMinted events
 */
export function watchReputationMinted(
  onReputationMinted: (log: {
    worker: string;
    tier: number;
    timestamp: bigint;
  }) => void,
) {
  const publicClient = getPublicClient();

  return publicClient.watchContractEvent({
    address: REPUTATION_ADDRESS,
    abi: reputationAbi,
    eventName: "ReputationMinted",
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (
          log.args.worker &&
          log.args.tier !== undefined &&
          log.args.timestamp
        ) {
          onReputationMinted({
            worker: log.args.worker,
            tier: log.args.tier,
            timestamp: log.args.timestamp,
          });
        }
      });
    },
  });
}

/**
 * Format USDC amount (18 decimals on Arc Testnet)
 */
export function formatUsdc(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(6);
}

/**
 * Parse USDC amount to wei (18 decimals)
 */
export function parseUsdc(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e18));
}

/**
 * Generate task ID from string
 */
export function generateTaskId(input: string): `0x${string}` {
  // In production, use keccak256 or similar
  // For now, simple hex encoding
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hex = Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex.padEnd(64, "0")}` as `0x${string}`;
}
