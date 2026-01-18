"use client";

import { useEffect, useState } from "react";
import { protocolService } from "@/lib/protocolService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface WorkerStatsDisplayProps {
  address: string;
}

export function WorkerStatsDisplay({ address }: WorkerStatsDisplayProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const loadStats = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const data = await protocolService.getWorkerStats(address.toLowerCase());
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      // Stats might not exist yet, that's okay
    } finally {
      setLoading(false);
    }
  };

  const calculateReputation = async () => {
    if (!address) return;

    setCalculating(true);
    try {
      const result = await protocolService.calculateReputation({
        worker_address: address.toLowerCase(),
      });

      toast.success(`Reputation calculated: ${result.tier_name}`, {
        description: `${
          result.successful_tasks
        } tasks completed with ${result.accuracy_rate.toFixed(1)}% accuracy`,
      });

      // Reload stats
      await loadStats();
    } catch (error: any) {
      toast.error("Failed to calculate reputation", {
        description: error.message,
      });
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [address]);

  if (loading) {
    return <div className="animate-pulse">Loading stats...</div>;
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Worker Statistics</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={calculateReputation} disabled={calculating}>
            {calculating ? "Calculating..." : "Calculate Reputation"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 0:
        return "secondary";
      case 1:
        return "default"; // Bronze
      case 2:
        return "secondary"; // Silver
      case 3:
        return "default"; // Gold
      case 4:
        return "default"; // Platinum
      default:
        return "secondary";
    }
  };

  const getTierEmoji = (tier: number) => {
    switch (tier) {
      case 0:
        return "🆕";
      case 1:
        return "🥉";
      case 2:
        return "🥈";
      case 3:
        return "🥇";
      case 4:
        return "💎";
      default:
        return "❓";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Worker Statistics</span>
          <Badge variant={getTierColor(stats.reputation_tier)}>
            {getTierEmoji(stats.reputation_tier)} {stats.tier_name}
          </Badge>
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          {stats.address}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
            <div className="text-2xl font-bold">{stats.total_tasks}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed_tasks}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Failed</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.failed_tasks}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg Confidence</div>
            <div className="text-2xl font-bold">
              {(stats.average_confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Total Earnings
          </div>
          <div className="text-3xl font-bold text-primary">
            ${(Number(stats.earnings_total) / 1_000_000).toFixed(2)} USDC
          </div>
        </div>

        {stats.fraud_reports > 0 && (
          <div className="rounded-lg bg-red-50 p-3">
            <div className="text-sm font-medium text-red-800">
              ⚠️ {stats.fraud_reports} fraud report
              {stats.fraud_reports > 1 ? "s" : ""}
            </div>
          </div>
        )}

        <Button
          onClick={calculateReputation}
          disabled={calculating}
          className="w-full"
          variant="outline"
        >
          {calculating ? "Calculating..." : "Refresh Reputation"}
        </Button>
      </CardContent>
    </Card>
  );
}
