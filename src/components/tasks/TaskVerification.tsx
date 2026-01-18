"use client";

import { useState } from "react";
import { protocolService, type TaskSubmission } from "@/lib/protocolService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TaskVerificationProps {
  taskId: string;
  workerAddress: string;
  taskType: "captcha" | "image_labeling" | "text_validation" | "custom";
  onVerified?: (result: any) => void;
}

export function TaskVerification({
  taskId,
  workerAddress,
  taskType,
  onVerified,
}: TaskVerificationProps) {
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [solution, setSolution] = useState("");

  const handleSubmit = async () => {
    if (!solution.trim()) {
      toast.error("Please enter a solution");
      return;
    }

    setSubmitting(true);
    const timeTaken = Date.now() - startTime;

    try {
      // Build submission based on task type
      let submission: TaskSubmission;

      switch (taskType) {
        case "captcha":
          submission = {
            type: "captcha",
            solution: solution,
            time_taken_ms: timeTaken,
          };
          break;
        case "image_labeling":
          submission = {
            type: "image_labeling",
            labels: solution.split(",").map((s) => s.trim()),
            confidence: 0.85,
          };
          break;
        case "text_validation":
          submission = {
            type: "text_validation",
            is_valid: solution.toLowerCase() === "valid",
            issues:
              solution.toLowerCase() === "valid" ? [] : ["Invalid content"],
          };
          break;
        default:
          submission = {
            type: "custom",
            data: { solution },
          };
      }

      // Call Rust verification service
      const result = await protocolService.verifyTask({
        task_id: taskId,
        worker: workerAddress.toLowerCase(),
        submission,
      });

      if (result.verified && result.payment_initiated) {
        toast.success("Task verified! Payment released.", {
          description: `Confidence: ${(result.confidence_score * 100).toFixed(
            1
          )}% • ${result.message}`,
          duration: 5000,
        });
      } else if (result.verified && !result.payment_initiated) {
        toast.warning("Task verified but payment failed", {
          description: result.message,
        });
      } else {
        toast.error("Verification failed", {
          description: `Confidence: ${(result.confidence_score * 100).toFixed(
            1
          )}% • ${result.message}`,
        });
      }

      onVerified?.(result);
    } catch (error: any) {
      toast.error("Verification error", {
        description: error.message || "Failed to verify task",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Task Solution</CardTitle>
        <CardDescription>
          Task ID:{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {taskId.slice(0, 10)}...
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            {taskType === "captcha" && "Enter CAPTCHA solution"}
            {taskType === "image_labeling" && "Enter labels (comma-separated)"}
            {taskType === "text_validation" &&
              "Is this valid? (type 'valid' or 'invalid')"}
            {taskType === "custom" && "Enter your solution"}
          </label>
          <Input
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder={
              taskType === "captcha"
                ? "e.g., XY7Z"
                : taskType === "image_labeling"
                ? "e.g., cat, dog, tree"
                : taskType === "text_validation"
                ? "valid or invalid"
                : "Enter solution"
            }
            disabled={submitting}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Time elapsed:</span>
          <Badge variant="secondary">
            {Math.floor((Date.now() - startTime) / 1000)}s
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !solution.trim()}
          className="w-full"
        >
          {submitting
            ? "Verifying with Rust service..."
            : "Submit for Verification"}
        </Button>
      </CardFooter>
    </Card>
  );
}
