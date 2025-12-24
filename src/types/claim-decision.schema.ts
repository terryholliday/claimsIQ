/**
 * ============================================
 * PROVENIQ CLAIMSIQ - CLAIM DECISION SCHEMA
 * ============================================
 * 
 * Decision output from the Decision Engine.
 * MUST include rationale_metadata suitable for regulators.
 */

import { z } from 'zod';

/**
 * Decision Outcome - Final verdict
 */
export const DecisionOutcomeSchema = z.enum([
  'PAY',     // Approve and pay the claim
  'DENY',    // Reject the claim
  'REVIEW',  // Requires manual review
]);

export type DecisionOutcome = z.infer<typeof DecisionOutcomeSchema>;

/**
 * Denial Reason - Why a claim was denied
 */
export const DenialReasonSchema = z.enum([
  'POLICY_NOT_ACTIVE',
  'ASSET_NOT_COVERED',
  'OWNER_MISMATCH',
  'COVERAGE_LIMIT_EXCEEDED',
  'DUPLICATE_CLAIM',
  'FRAUD_DETECTED',
  'INSUFFICIENT_EVIDENCE',
  'EXCLUSION_APPLIES',
  'LATE_SUBMISSION',
  'OTHER',
]);

export type DenialReason = z.infer<typeof DenialReasonSchema>;

/**
 * Review Reason - Why a claim requires manual review
 */
export const ReviewReasonSchema = z.enum([
  'HIGH_VALUE_CLAIM',
  'FRAUD_SIGNALS_DETECTED',
  'PARTIAL_VERIFICATION',
  'COMPLEX_CLAIM',
  'POLICY_AMBIGUITY',
  'ESCALATED_BY_SYSTEM',
  'OTHER',
]);

export type ReviewReason = z.infer<typeof ReviewReasonSchema>;

/**
 * Rationale Factor - Individual factor in decision rationale
 * Suitable for regulatory audit
 */
export const RationaleFactorSchema = z.object({
  factor_id: z.string(),
  factor_type: z.enum([
    'LEDGER_VERIFICATION',
    'FRAUD_SIGNAL',
    'POLICY_RULE',
    'COVERAGE_CHECK',
    'EVIDENCE_ANALYSIS',
    'MANUAL_OVERRIDE',
  ]),
  
  // What was evaluated
  description: z.string(),
  
  // Result of evaluation
  result: z.enum(['PASS', 'FAIL', 'PARTIAL', 'SKIPPED']),
  
  // Impact on decision
  weight: z.number().min(0).max(1),
  impact: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']),
  
  // Supporting data
  source_data: z.record(z.string(), z.unknown()).optional(),
  
  // Timestamps
  evaluated_at: z.string().datetime(),
});

export type RationaleFactor = z.infer<typeof RationaleFactorSchema>;

/**
 * Rationale Metadata - Full audit trail for regulators
 */
export const RationaleMetadataSchema = z.object({
  // Decision summary
  decision_summary: z.string(),
  
  // All factors considered
  factors: z.array(RationaleFactorSchema),
  
  // Aggregated scores
  verification_score: z.number().min(0).max(100),
  fraud_risk_score: z.number().min(0).max(100),
  confidence_score: z.number().min(0).max(100),
  
  // Thresholds applied
  auto_approve_threshold: z.number().min(0).max(100),
  auto_deny_threshold: z.number().min(0).max(100),
  
  // Rule engine version
  rule_engine_version: z.string(),
  model_versions: z.record(z.string(), z.string()).optional(),
  
  // Regulatory compliance
  regulatory_jurisdiction: z.string().optional(),
  compliance_checks: z.array(z.object({
    check_id: z.string(),
    check_name: z.string(),
    passed: z.boolean(),
    notes: z.string().optional(),
  })).optional(),
});

export type RationaleMetadata = z.infer<typeof RationaleMetadataSchema>;

/**
 * ClaimDecision - Final decision on a claim
 */
export const ClaimDecisionSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  
  // Decision outcome
  decision: DecisionOutcomeSchema,
  
  // Denial details (if DENY)
  denial_reason: DenialReasonSchema.optional(),
  denial_explanation: z.string().optional(),
  
  // Review details (if REVIEW)
  review_reason: ReviewReasonSchema.optional(),
  review_priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional(),
  
  // Approved amount (if PAY)
  approved_amount_minor_units: z.bigint().optional(),
  approved_currency: z.string().optional(),
  
  // Rationale - REQUIRED for regulatory compliance
  rationale: RationaleMetadataSchema,
  
  // Decision maker
  decided_by: z.enum(['SYSTEM', 'MANUAL']),
  decided_by_user_id: z.string().optional(),
  
  // Timestamps
  decided_at: z.string().datetime(),
  
  // Audit hash
  decision_hash: z.string(),
});

export type ClaimDecision = z.infer<typeof ClaimDecisionSchema>;

/**
 * Decision Request - Input to Decision Engine
 */
export const DecisionRequestSchema = z.object({
  claim_id: z.string().uuid(),
  ledger_verification_id: z.string().uuid(),
  fraud_assessment_id: z.string().uuid().optional(),
  force_review: z.boolean().default(false),
});

export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;
