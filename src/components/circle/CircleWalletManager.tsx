"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, CheckCircle2, Globe } from "lucide-react";
import {
  createCircleWallet,
  getUserCircleWallet,
  CircleWallet,
} from "@/lib/circleService";
import { CircleBalance } from "./CircleBalance";
import { CircleTransactionHistory } from "./CircleTransactionHistory";
import { ExternalBalance } from "./ExternalBalance";
import { createWalletClient, custom, defineChain } from "viem";

// Arc Testnet Chain Configuration
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

interface CircleWalletManagerProps {
  userId: string;
}

export function CircleWalletManager({ userId }: CircleWalletManagerProps) {
  const [wallet, setWallet] = useState<CircleWallet | null>(null);
  const [externalWalletAddress, setExternalWalletAddress] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [connectingExternal, setConnectingExternal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWallet();
  }, [userId]);

  const loadWallet = async () => {
    try {
      const existingWallet = await getUserCircleWallet(userId);
      setWallet(existingWallet);
    } catch (err) {
      console.error("Failed to load wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setCreating(true);
    setError(null);

    try {
      const newWallet = await createCircleWallet(userId);
      setWallet(newWallet as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
    } finally {
      setCreating(false);
    }
  };

  const handleConnectExternal = async () => {
    setConnectingExternal(true);
    setError(null);

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error(
          "No wallet installed. Please install Metamask or Coinbase Wallet.",
        );
      }

      const client = createWalletClient({
        chain: arcTestnet,
        transport: custom(window.ethereum),
      });

      const [address] = await client.requestAddresses();
      setExternalWalletAddress(address);
    } catch (err) {
      console.error("Failed to connect external wallet:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnectingExternal(false);
    }
  };

  const disconnectExternal = () => {
    setExternalWalletAddress(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Show External Wallet if connected
  if (externalWalletAddress) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Arc Wallet
              </CardTitle>
              <CardDescription>Arc Testnet • Active</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={disconnectExternal}>
              Disconnect
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Wallet Address
              </label>
              <div className="mt-1 relative group">
                <p className="text-xs font-mono bg-muted p-3 rounded-md break-all border group-hover:border-blue-200 transition-colors">
                  {externalWalletAddress}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Balance
              </label>
              <div className="mt-2">
                <ExternalBalance address={externalWalletAddress} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-2 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">
                  Connected via Browser Extension
                </span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold">Ready for Tasks</span>
              </div>
              <p className="text-[10px] text-blue-600/80">
                You can now use this wallet to receive payments and verify tasks
                on the Base Sepolia network.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!wallet) {
    return null; // Wallet connection is handled on the connect-wallet page
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Your Circle Wallet
          </CardTitle>
          <CardDescription>
            {wallet.blockchain} • {wallet.state}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wallet.wallet_address && (
            <div>
              <label className="text-sm font-medium">Wallet Address</label>
              <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                {wallet.wallet_address}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Balance</label>
            <div className="mt-2">
              <CircleBalance walletId={wallet.circle_wallet_id} />
            </div>
          </div>
        </CardContent>
      </Card>

      <CircleTransactionHistory walletId={wallet.circle_wallet_id} />
    </div>
  );
}
