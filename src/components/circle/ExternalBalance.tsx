"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getUsdcBalance, formatUsdc } from "@/lib/blockchain";

interface ExternalBalanceProps {
  address: string;
  className?: string;
}

export function ExternalBalance({ address, className }: ExternalBalanceProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(loadBalance, 30000);
    return () => clearInterval(interval);
  }, [address]);

  const loadBalance = async () => {
    try {
      // Cast address to match the type expected by getUsdcBalance if necessary, 
      // but usually 0x string is widely accepted. Function signature says `0x${string}`.
      if (!address.startsWith("0x")) {
         throw new Error("Invalid address format");
      }
      const rawBalance = await getUsdcBalance(address as `0x${string}`);
      const formatted = formatUsdc(rawBalance);
      setBalance(formatted);
      setError(null);
    } catch (err) {
      console.error("Failed to load external balance:", err);
      setError("Error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !balance) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs text-muted-foreground">Fetching...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Badge variant="outline" className={`text-destructive border-destructive ${className}`}>
        {error}
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className="text-lg font-mono px-3 py-1">
        ${balance} USDC
      </Badge>
    </div>
  );
}
