"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getWalletBalance } from "@/lib/circleService";

interface CircleBalanceProps {
  walletId: string;
  className?: string;
}

export function CircleBalance({ walletId, className }: CircleBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(loadBalance, 30000);
    return () => clearInterval(interval);
  }, [walletId]);

  const loadBalance = async () => {
    try {
      const bal = await getWalletBalance(walletId);
      setBalance(bal);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load balance");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          Loading balance...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Badge variant="destructive" className={className}>
        Error loading balance
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className="text-lg font-mono">
        ${balance?.toFixed(2)} USDC
      </Badge>
    </div>
  );
}
