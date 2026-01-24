import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  formatEther,
  formatUnits,
  parseAbi,
  defineChain,
  type WalletClient,
  type PublicClient,
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
import { createCircleWallet } from "./circleService";
import { supabase } from "./supabaseClient";
// EIP-6963 Types
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

// Window event type
interface EIP6963AnnounceProviderEvent extends CustomEvent {
  detail: {
    info: EIP6963ProviderInfo;
    provider: any;
  };
}

declare global {
  interface Window {
    ethereum?: any;
    addEventListener(
      type: "eip6963:announceProvider",
      listener: (event: EIP6963AnnounceProviderEvent) => void,
    ): void;
    removeEventListener(
      type: "eip6963:announceProvider",
      listener: (event: EIP6963AnnounceProviderEvent) => void,
    ): void;
  }
}

export interface WalletInfo {
  address: string;
  chainId: number;
  balance: string;
  circleWalletId?: string;
}

// Store discovered providers
let discoveredProviders: EIP6963ProviderDetail[] = [];

// Listen for providers immediately
if (typeof window !== "undefined") {
  window.addEventListener(
    "eip6963:announceProvider",
    (event: EIP6963AnnounceProviderEvent) => {
      const detail = event.detail;
      if (!discoveredProviders.some((p) => p.info.uuid === detail.info.uuid)) {
        discoveredProviders.push({
          info: detail.info,
          provider: detail.provider,
        });
      }
    },
  );

  // Request providers to announce themselves
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function getInjectedProviders(): EIP6963ProviderDetail[] {
  return discoveredProviders;
}

/**
 * Subscribe to provider announcements
 */
export function onProviderDiscovered(
  callback: (provider: EIP6963ProviderDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: EIP6963AnnounceProviderEvent) => {
    callback({
      info: event.detail.info,
      provider: event.detail.provider,
    });
  };

  window.addEventListener("eip6963:announceProvider", listener);

  // Re-dispatch request to catch late loads
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  return () => window.removeEventListener("eip6963:announceProvider", listener);
}

// Clients
let walletClient: any = null;
let publicClient: any = null;

function getClients(specificProvider?: any) {
  if (typeof window === "undefined") return null;

  // Use specific provider if given, otherwise fallback to window.ethereum
  const provider = specificProvider || window.ethereum;
  if (!provider) return null;

  // Always recreate wallet client if a specific provider is requested
  // OR if we don't have one yet
  if (specificProvider || !walletClient) {
    walletClient = createWalletClient({
      chain: arcTestnet,
      transport: custom(provider),
    });
  }

  if (!publicClient) {
    publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(), // Uses Arc Testnet RPC
    });
  }

  return { walletClient, publicClient };
}

/**
 * Connect to a specific Web3 wallet
 * @param specificProvider Optional EIP-1193 provider (from EIP-6963)
 */
export async function connectWallet(
  specificProvider?: any,
): Promise<WalletInfo> {
  console.log(
    "🔌 connectWallet called with provider:",
    specificProvider ? "custom" : "default",
  );

  // If no specific provider, check for window.ethereum
  if (
    !specificProvider &&
    (typeof window === "undefined" || !window.ethereum)
  ) {
    throw new Error(
      "No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.",
    );
  }

  try {
    console.log("📱 Getting wallet clients...");
    const clients = getClients(specificProvider);
    if (!clients) throw new Error("Failed to initialize wallet client");

    const { walletClient, publicClient } = clients;
    console.log("✅ Clients initialized");

    // Request accounts
    console.log("🔐 Requesting wallet addresses...");
    const [address] = await walletClient.requestAddresses();

    if (!address) {
      throw new Error("No accounts found. Please unlock your wallet.");
    }
    console.log("✅ Address received:", address);

    // Get Chain ID
    console.log("🔗 Getting chain ID...");
    const chainId = await walletClient.getChainId();
    console.log("✅ Current chain ID:", chainId);

    // Switch chain if needed
    const targetChainId = arcTestnet.id;
    console.log("🎯 Target chain ID (Arc Testnet):", targetChainId);

    if (chainId !== targetChainId) {
      console.log("⚠️ Wrong chain, switching to Arc Testnet...");
      await switchToArcTestnet(); // This uses the cached walletClient which is now updated
      console.log("✅ Switched to Arc Testnet");
    } else {
      console.log("✅ Already on Arc Testnet");
    }

    // Get Balance
    console.log("💰 Getting balance...");
    const balance = await publicClient!.getBalance({ address });
    const balanceInEth = formatEther(balance);
    console.log("✅ Balance:", balanceInEth, "USDC");

    return {
      address,
      chainId: targetChainId,
      balance: balanceInEth,
    };
  } catch (error: any) {
    console.error("Wallet connection error:", error);
    if (error.code === 4001) {
      throw new Error("User rejected the connection request.");
    }
    throw new Error(error.message || "Failed to connect wallet");
  }
}

// Keep legacy alias for compatibility if needed, but implementation matches connectWallet
export const connectMetaMask = connectWallet;

/**
 * Switch to Arc Testnet
 */
export async function switchToArcTestnet(): Promise<void> {
  const clients = getClients();
  if (!clients) throw new Error("No wallet detected");

  try {
    await clients.walletClient.switchChain({ id: arcTestnet.id });
  } catch (error: any) {
    // 4902 = Chain not found
    if (error.code === 4902 || error.message?.includes("Unrecognized chain")) {
      await addArcTestnet();
    } else {
      throw error;
    }
  }
}

// Keep legacy alias for compatibility
export const switchToBaseSepolia = switchToArcTestnet;

/**
 * Add Arc Testnet
 */
export async function addArcTestnet(): Promise<void> {
  const clients = getClients();
  if (!clients) throw new Error("No wallet detected");

  await clients.walletClient.addChain({ chain: arcTestnet });
}

// Keep legacy alias for compatibility
export const addBaseSepolia = addArcTestnet;

/**
 * Sign a message
 */
export async function signMessage(message: string): Promise<string> {
  const clients = getClients();
  if (!clients) throw new Error("No wallet detected");

  const [account] = await clients.walletClient.getAddresses();
  return clients.walletClient.signMessage({
    account,
    message,
  });
}

/**
 * Create or get Circle wallet from Supabase/Backend
 * (No viem changes needed here, logic is backend/supabase)
 */
export async function ensureCircleWallet(
  userId: string,
  walletAddress: string,
): Promise<string> {
  const { data: existingWallet } = await supabase
    .from("circle_wallets")
    .select("circle_wallet_id")
    .eq("user_id", userId)
    .single();

  if (existingWallet?.circle_wallet_id) {
    return existingWallet.circle_wallet_id;
  }

  try {
    const circleWallet = await createCircleWallet(userId);

    await supabase.from("circle_wallets").insert({
      user_id: userId,
      circle_wallet_id: circleWallet.id,
      wallet_address: circleWallet.wallet_address || null,
      blockchain: "BASE-SEPOLIA",
      state: circleWallet.state,
    });

    return circleWallet.id;
  } catch (error) {
    console.error("Failed to create Circle wallet:", error);
    throw error;
  }
}

/**
 * Get ETH Balance
 */
export async function getWalletBalance(address: string): Promise<string> {
  const clients = getClients();
  if (!clients) throw new Error("No wallet detected");

  const balance = await clients.publicClient.getBalance({
    address: address as `0x${string}`,
  });
  return formatEther(balance);
}

/**
 * Get USDC Balance
 */
export async function getUSDCBalance(address: string): Promise<string> {
  const clients = getClients();
  if (!clients) throw new Error("No wallet detected");

  const usdcAddress = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as `0x${string}`;

  const abi = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ]);

  const [balance, decimals] = await Promise.all([
    clients.publicClient.readContract({
      address: usdcAddress,
      abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    }),
    clients.publicClient.readContract({
      address: usdcAddress,
      abi,
      functionName: "decimals",
    }),
  ]);

  return formatUnits(balance, decimals);
}

/**
 * Check Reputation NFT
 */
export async function hasReputationNFT(address: string): Promise<boolean> {
  const clients = getClients();
  if (!clients) return false;

  const reputationAddress = process.env
    .NEXT_PUBLIC_REPUTATION_ADDRESS as `0x${string}`;
  if (!reputationAddress) return false;

  try {
    const balance = await clients.publicClient.readContract({
      address: reputationAddress,
      abi: parseAbi([
        "function balanceOf(address owner) view returns (uint256)",
      ]),
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });
    return balance > 0n;
  } catch (error) {
    return false;
  }
}

/**
 * Listeners
 */
export function onAccountsChanged(
  callback: (accounts: string[]) => void,
): () => void {
  if (typeof window !== "undefined" && window.ethereum) {
    window.ethereum.on("accountsChanged", callback);
    return () => window.ethereum.removeListener("accountsChanged", callback);
  }
  return () => {};
}

export function onChainChanged(
  callback: (chainId: string) => void,
): () => void {
  if (typeof window !== "undefined" && window.ethereum) {
    window.ethereum.on("chainChanged", callback);
    return () => window.ethereum.removeListener("chainChanged", callback);
  }
  return () => {};
}

export async function disconnectWallet(): Promise<void> {
  // No explicit disconnect in pure Web3, just cleaning up is enough usually
  if (walletClient) walletClient = null;
  if (publicClient) publicClient = null;
}
