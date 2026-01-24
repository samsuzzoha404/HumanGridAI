/**
 * Circle User-Controlled Wallets SDK Configuration
 * This manages worker wallets for HumanGridAI
 */

import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

// Circle App ID from environment
const CIRCLE_APP_ID = process.env.NEXT_PUBLIC_CIRCLE_UCW_APP_ID!;

if (!CIRCLE_APP_ID) {
  throw new Error("NEXT_PUBLIC_CIRCLE_UCW_APP_ID is not configured");
}

/**
 * Initialize Circle SDK
 * Call this once when your app loads
 */
export function initCircleSDK() {
  const sdk = initiateUserControlledWalletsClient({
    apiKey: CIRCLE_APP_ID,
  });

  return sdk;
}

/**
 * Configuration for Circle SDK initialization
 */
export interface CircleSDKConfig {
  appId: string;
  endpoint?: string; // Default: https://api.circle.com
}

export const circleConfig: CircleSDKConfig = {
  appId: CIRCLE_APP_ID,
};

/**
 * Challenge types for Circle operations
 */
export enum ChallengeType {
  CREATE_WALLET = "CREATE_WALLET",
  SIGN_TRANSACTION = "SIGN_TRANSACTION",
  CREATE_PIN = "CREATE_PIN",
  CHANGE_PIN = "CHANGE_PIN",
}

/**
 * Wallet creation response
 */
export interface WalletCreationResult {
  walletId: string;
  address?: string;
  blockchain: string;
}

/**
 * Transaction signing response
 */
export interface TransactionResult {
  signature: string;
  txHash?: string;
  status: "pending" | "confirmed" | "failed";
}
