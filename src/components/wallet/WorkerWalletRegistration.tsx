"use client";

/**
 * Worker Wallet Registration Component
 * Allows workers to create Circle User-Controlled Wallets
 */

import { useState, useEffect } from "react";
// TODO: Re-enable Circle SDK after dependency fix
// import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { circleConfig } from "@/lib/circleWalletSDK";

interface WorkerWalletRegistrationProps {
  userId: string;
  onWalletCreated?: (walletId: string, address: string) => void;
}

export default function WorkerWalletRegistration({
  userId,
  onWalletCreated,
}: WorkerWalletRegistrationProps) {
  const [sdk, setSdk] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [walletMode, setWalletMode] = useState<"select" | "create" | "connect">(
    "select",
  );
  const [walletData, setWalletData] = useState<{
    walletId: string;
    address: string;
  } | null>(null);

  useEffect(() => {
    // Temporarily enable SDK placeholder to show UI
    setSdk({ placeholder: true });

    // TODO: Re-enable Circle SDK initialization
    // const initSDK = async () => {
    //   try {
    //     const circleClient = initiateUserControlledWalletsClient({
    //       apiKey: circleConfig.appId,
    //     });
    //     setSdk(circleClient);
    //   } catch (err) {
    //     console.error("Failed to initialize Circle SDK:", err);
    //     setError(
    //       "Failed to initialize wallet system. Please refresh the page.",
    //     );
    //   }
    // };
    // initSDK();
  }, []);

  const createWorkerWallet = async () => {
    if (!sdk) {
      setError("Wallet system not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Request wallet creation from backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_RUST_SERVICE_URL}/api/workers/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            blockchain: "ETH-ARC-TESTNET",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to initiate wallet creation");
      }

      const { user_token, encryption_key, challenge_id } =
        await response.json();

      // Note: For User-Controlled wallets, the backend handles wallet creation
      // The frontend polls for wallet status

      // Poll for challenge completion or use webhooks
      const checkChallengeStatus = async () => {
        const statusResponse = await fetch(
          `${process.env.NEXT_PUBLIC_RUST_SERVICE_URL}/api/workers/wallet-status?user_id=${userId}`,
        );

        if (statusResponse.ok) {
          const walletInfo = await statusResponse.json();
          if (walletInfo.wallet_id && walletInfo.address) {
            setWalletData({
              walletId: walletInfo.wallet_id,
              address: walletInfo.address,
            });
            setSuccess(true);
            setLoading(false);

            // Notify parent component
            if (onWalletCreated) {
              onWalletCreated(walletInfo.wallet_id, walletInfo.address);
            }
          }
        }
      };

      // Check status after a brief delay
      setTimeout(checkChallengeStatus, 2000);
    } catch (err: any) {
      console.error("Wallet registration error:", err);
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const connectExistingWallet = async () => {
    if (!sdk) {
      setError("Wallet system not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Request wallet restoration from backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_RUST_SERVICE_URL}/api/workers/restore`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to initiate wallet connection");
      }

      const { user_token, encryption_key, challenge_id } =
        await response.json();

      // For User-Controlled wallets, check if wallet exists for this user
      const checkWalletStatus = async () => {
        const statusResponse = await fetch(
          `${process.env.NEXT_PUBLIC_RUST_SERVICE_URL}/api/workers/wallet-status?user_id=${userId}`,
        );

        if (statusResponse.ok) {
          const walletInfo = await statusResponse.json();
          if (walletInfo.wallet_id && walletInfo.address) {
            setWalletData({
              walletId: walletInfo.wallet_id,
              address: walletInfo.address,
            });
            setSuccess(true);
            setLoading(false);

            // Notify parent component
            if (onWalletCreated) {
              onWalletCreated(walletInfo.wallet_id, walletInfo.address);
            }
          } else {
            setError("No existing wallet found for this account.");
            setLoading(false);
          }
        } else {
          setError("Failed to retrieve wallet information.");
          setLoading(false);
        }
      };

      // Check wallet status
      setTimeout(checkWalletStatus, 1000);
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {walletMode === "select"
            ? "Wallet Setup"
            : walletMode === "create"
            ? "Create Your Worker Wallet"
            : "Connect Your Wallet"}
        </CardTitle>
        <CardDescription>
          {walletMode === "select"
            ? "Choose how you want to set up your payment wallet"
            : "Set up a secure crypto wallet to receive USDC payments instantly"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && walletData && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-1">
                <p className="font-semibold">
                  {walletMode === "create"
                    ? "Wallet created successfully!"
                    : "Wallet connected successfully!"}
                </p>
                <p className="text-sm font-mono break-all">
                  {walletData.address}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!success && walletMode === "select" && (
          <div className="space-y-3">
            <Button
              onClick={() => setWalletMode("create")}
              disabled={!sdk}
              variant="default"
              className="w-full h-auto py-6 flex-col gap-2"
              size="lg"
            >
              <Wallet className="h-6 w-6" />
              <div className="text-left w-full">
                <div className="font-semibold">Create New Wallet</div>
                <div className="text-xs font-normal opacity-90">
                  Set up a fresh wallet for receiving payments
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setWalletMode("connect")}
              disabled={!sdk}
              variant="outline"
              className="w-full h-auto py-6 flex-col gap-2"
              size="lg"
            >
              <CheckCircle2 className="h-6 w-6" />
              <div className="text-left w-full">
                <div className="font-semibold">Connect Existing Wallet</div>
                <div className="text-xs font-normal opacity-90">
                  Restore access to your previously created wallet
                </div>
              </div>
            </Button>

            <div className="rounded-lg border p-4 space-y-2 mt-4">
              <h4 className="font-semibold text-sm">What you'll get:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Secure crypto wallet on Arc Network</li>
                <li>✅ Instant USDC payments</li>
                <li>✅ PIN-protected (no seed phrases)</li>
                <li>✅ Full control - withdraw anytime</li>
              </ul>
            </div>
          </div>
        )}

        {!success && walletMode === "create" && (
          <div className="space-y-4">
            <Button
              onClick={() => setWalletMode("select")}
              variant="ghost"
              size="sm"
              className="mb-2"
            >
              ← Back to options
            </Button>

            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold text-sm">Creating a new wallet:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Secure crypto wallet on Arc Network</li>
                <li>✅ Instant USDC payments</li>
                <li>✅ PIN-protected (no seed phrases)</li>
                <li>✅ Full control - withdraw anytime</li>
              </ul>
            </div>

            <Button
              onClick={createWorkerWallet}
              disabled={loading || !sdk}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Wallet...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Create Wallet
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You'll be prompted to create a 6-digit PIN to secure your wallet
            </p>
          </div>
        )}

        {!success && walletMode === "connect" && (
          <div className="space-y-4">
            <Button
              onClick={() => setWalletMode("select")}
              variant="ghost"
              size="sm"
              className="mb-2"
            >
              ← Back to options
            </Button>

            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold text-sm">Connecting your wallet:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>🔑 Enter your existing 6-digit PIN</li>
                <li>🔄 Restore full access to your wallet</li>
                <li>💰 View your USDC balance</li>
                <li>📤 Continue receiving payments</li>
              </ul>
            </div>

            <Button
              onClick={connectExistingWallet}
              disabled={loading || !sdk}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting Wallet...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You'll be prompted to enter your existing 6-digit PIN
            </p>
          </div>
        )}

        {success && (
          <Button
            onClick={() => (window.location.href = "/dashboard?tab=wallet")}
            className="w-full"
            size="lg"
          >
            Go to Dashboard
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
