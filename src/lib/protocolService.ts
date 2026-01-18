/**
 * HumanGrid Protocol Service API Client
 *
 * This module provides type-safe access to the Rust verification service.
 * All verification logic, fraud detection, and reputation calculations
 * happen in Rust - this is just the transport layer.
 */

const RUST_SERVICE_URL =
  process.env.NEXT_PUBLIC_RUST_SERVICE_URL || "http://localhost:8080";

// Types matching Rust service models

export enum TaskType {
  Captcha = "captcha",
  ImageLabeling = "image_labeling",
  TextValidation = "text_validation",
  Custom = "custom",
}

export enum TaskStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Submitted = "submitted",
  Verified = "verified",
  Rejected = "rejected",
  Paid = "paid",
  Cancelled = "cancelled",
}

export interface CaptchaSubmission {
  type: "captcha";
  solution: string;
  time_taken_ms: number;
}

export interface ImageLabelingSubmission {
  type: "image_labeling";
  labels: string[];
  confidence: number;
}

export interface TextValidationSubmission {
  type: "text_validation";
  is_valid: boolean;
  issues: string[];
}

export interface CustomSubmission {
  type: "custom";
  data: any;
}

export type TaskSubmission =
  | CaptchaSubmission
  | ImageLabelingSubmission
  | TextValidationSubmission
  | CustomSubmission;

export interface VerifyTaskRequest {
  task_id: string;
  worker: string;
  submission: TaskSubmission;
}

export interface VerifyTaskResponse {
  task_id: string;
  verified: boolean;
  confidence_score: number;
  proof_hash: string;
  payment_initiated: boolean;
  message: string;
}

export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  confidence_score?: number;
  verified_at?: number;
}

export interface CalculateReputationRequest {
  worker_address: string;
}

export interface CalculateReputationResponse {
  worker_address: string;
  total_tasks: number;
  successful_tasks: number;
  accuracy_rate: number;
  current_tier: number;
  tier_name: string;
  next_tier_at?: number;
}

export interface WorkerStats {
  address: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  average_confidence: number;
  reputation_tier: number;
  tier_name: string;
  earnings_total: string;
  fraud_reports: number;
}

export interface ReportFraudRequest {
  task_id: string;
  worker: string;
  reason: string;
  evidence: any;
}

export interface ReportFraudResponse {
  fraud_report_id: string;
  status: string;
  action_taken: string;
}

/**
 * HumanGrid Protocol Service Client
 */
export class ProtocolServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = RUST_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check service health
   */
  async health(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Verify a task submission
   * This calls the Rust service which will:
   * 1. Validate the submission
   * 2. Calculate confidence score
   * 3. Run fraud detection
   * 4. If verified, call Solidity to release payment
   */
  async verifyTask(request: VerifyTaskRequest): Promise<VerifyTaskResponse> {
    const response = await fetch(`${this.baseUrl}/api/verify-task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(error.error || "Verification failed");
    }

    return response.json();
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/task-status/${taskId}`);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(error.error || "Failed to get task status");
    }

    return response.json();
  }

  /**
   * Calculate worker reputation
   * This will also mint reputation SBT if tier increased
   */
  async calculateReputation(
    request: CalculateReputationRequest
  ): Promise<CalculateReputationResponse> {
    const response = await fetch(`${this.baseUrl}/api/calculate-reputation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(error.error || "Failed to calculate reputation");
    }

    return response.json();
  }

  /**
   * Get worker statistics
   */
  async getWorkerStats(address: string): Promise<WorkerStats> {
    const response = await fetch(`${this.baseUrl}/api/worker-stats/${address}`);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(error.error || "Failed to get worker stats");
    }

    return response.json();
  }

  /**
   * Report fraudulent activity
   */
  async reportFraud(request: ReportFraudRequest): Promise<ReportFraudResponse> {
    const response = await fetch(`${this.baseUrl}/api/report-fraud`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(error.error || "Failed to report fraud");
    }

    return response.json();
  }
}

// Singleton instance
export const protocolService = new ProtocolServiceClient();
