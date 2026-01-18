"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { startEventListeners, stopEventListeners } from "@/lib/eventListener";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface EventLog {
  id: string;
  type: "task_completed" | "reputation_minted";
  message: string;
  timestamp: Date;
}

export function BlockchainEventMonitor() {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Start listening on mount
    try {
      startEventListeners();
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start event listeners:", error);
    }

    // Cleanup on unmount
    return () => {
      stopEventListeners();
      setIsListening(false);
    };
  }, []);

  // In a real implementation, you'd subscribe to events and update the log
  // For now, this is a placeholder UI

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Blockchain Events</span>
          {isListening ? (
            <Badge variant="default" className="gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Listening
            </Badge>
          ) : (
            <Badge variant="secondary">Offline</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Real-time blockchain event stream from HumanGridEscrow and
          ReputationSBT contracts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Waiting for blockchain events...</p>
            <p className="text-sm mt-1">
              Events will appear here when tasks are completed or reputation is
              minted
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {event.type === "task_completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
