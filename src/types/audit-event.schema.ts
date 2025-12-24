 * ============================================
 * PROVENIQ CLAIMSIQ - AUDIT EVENT SCHEMA
 * ============================================
 * 
 * Immutable append-only event log for all state changes.
 * Every state change writes an AuditEvent.
 * 
 * RULE: Events are NEVER updated or deleted.
 */

import { z } from 'zod';

/**
 * Audit Event Type - What kind of event occurred
 */
export const AuditEventTypeSchema = z.enum([
  // Claim lifecycle
  'CLAIM_SUBMITTED',
  'CLAIM_VALIDATED',
  'CLAIM_REJECTED',
  'CLAIM_STATUS_CHANGED',
  
  // Evidence
  'EVIDENCE_SUBMITTED',
  'EVIDENCE_VERIFIED',
  'EVIDENCE_FLAGGED',
  'EVIDENCE_REJECTED',
  
  // Verification
  'LEDGER_VERIFICATION_STARTED',
  'LEDGER_VERIFICATION_COMPLETED',
  'LEDGER_VERIFICATION_FAILED',
  
  // Fraud detection
  'FRAUD_SIGNAL_DETECTED',
  'FRAUD_ASSESSMENT_COMPLETED',
  'FRAUD_SIGNAL_REVIEWED',
  
  // Decision
  'DECISION_RENDERED',
  'DECISION_OVERRIDDEN',
  'DECISION_APPEALED',
  
  // Payout
  'PAYOUT_INITIATED',
  'PAYOUT_COMPLETED',
  'PAYOUT_FAILED',
  
  // System
  'SYSTEM_ERROR',
  'SYSTEM_WARNING',
  'CONFIG_CHANGED',
  
  // Manual actions
  'MANUAL_REVIEW_STARTED',
  'MANUAL_REVIEW_COMPLETED',
  'MANUAL_OVERRIDE',
]);

export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

/**
 * Actor Type - Who/what triggered the event
 */
export const ActorTypeSchema = z.enum([
  'SYSTEM',
  'USER',
  'API',
  'WEBHOOK',
  'SCHEDULER',
]);

export type ActorType = z.infer<typeof ActorTypeSchema>;

/**
 * AuditEvent - Immutable event record
 */
export const AuditEventSchema = z.object({
  // Identity
  id: z.string().uuid(),
  sequence_number: z.bigint(),  // Monotonically increasing
  
  // Event classification
  event_type: AuditEventTypeSchema,
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
  
  // Subject - What entity was affected
  subject_type: z.enum(['CLAIM', 'EVIDENCE', 'DECISION', 'PAYOUT', 'SYSTEM']),
  subject_id: z.string(),
  
  // Actor - Who/what triggered the event
  actor_type: ActorTypeSchema,
  actor_id: z.string(),
  actor_ip: z.string().optional(),
  actor_user_agent: z.string().optional(),
  
  // Event data
  description: z.string(),
  
  // State change
  previous_state: z.record(z.string(), z.unknown()).optional(),
  new_state: z.record(z.string(), z.unknown()).optional(),
  
  // Additional context
  metadata: z.record(z.string(), z.unknown()).optional(),
  
  // Correlation
  correlation_id: z.string().uuid().optional(),
  parent_event_id: z.string().uuid().optional(),
  
  // Timestamps
  occurred_at: z.string().datetime(),
  recorded_at: z.string().datetime(),
  
  // Integrity
  event_hash: z.string(),
  previous_event_hash: z.string().optional(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

/**
 * AuditEventCreate - Input for creating new audit event
 */
export const AuditEventCreateSchema = z.object({
  event_type: AuditEventTypeSchema,
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
  subject_type: z.enum(['CLAIM', 'EVIDENCE', 'DECISION', 'PAYOUT', 'SYSTEM']),
  subject_id: z.string(),
  actor_type: ActorTypeSchema,
  actor_id: z.string(),
  description: z.string(),
  previous_state: z.record(z.string(), z.unknown()).optional(),
  new_state: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  correlation_id: z.string().uuid().optional(),
  parent_event_id: z.string().uuid().optional(),
});

export type AuditEventCreate = z.infer<typeof AuditEventCreateSchema>;

/**
 * AuditQuery - Query parameters for audit log
 */
export const AuditQuerySchema = z.object({
  subject_type: z.enum(['CLAIM', 'EVIDENCE', 'DECISION', 'PAYOUT', 'SYSTEM']).optional(),
  subject_id: z.string().optional(),
  event_type: AuditEventTypeSchema.optional(),
  actor_id: z.string().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

export type AuditQuery = z.infer<typeof AuditQuerySchema>;
