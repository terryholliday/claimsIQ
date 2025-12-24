/**
 * ============================================
 * PROVENIQ CLAIMSIQ - TYPE EXPORTS
 * ============================================
 * 
 * Canonical schemas and types.
 * No partial objects used across the codebase.
 */

// Claim
export {
  ClaimSchema,
  ClaimStatusSchema,
  ClaimTypeSchema,
  CurrencyCodeSchema,
  MonetaryAmountSchema,
  LocationSchema,
  ClaimIntakePayloadSchema,
  type Claim,
  type ClaimStatus,
  type ClaimType,
  type CurrencyCode,
  type MonetaryAmount,
  type Location,
  type ClaimIntakePayload,
  type ClaimValidationResult,
} from './claim.schema';

// Evidence
export {
  EvidenceSchema,
  EvidenceTypeSchema,
  EvidenceStatusSchema,
  EvidenceIntakePayloadSchema,
  type Evidence,
  type EvidenceType,
  type EvidenceStatus,
  type EvidenceIntakePayload,
} from './evidence.schema';

// Ledger Verification
export {
  LedgerVerificationSchema,
  LedgerAssetSchema,
  LedgerResultSchema,
  DiscrepancySchema,
  DiscrepancyTypeSchema,
  type LedgerVerification,
  type LedgerAsset,
  type LedgerResult,
  type Discrepancy,
  type DiscrepancyType,
} from './ledger-verification.schema';

// Fraud Signal
export {
  FraudSignalSchema,
  FraudSignalTypeSchema,
  FraudSeveritySchema,
  FraudAssessmentSchema,
  type FraudSignal,
  type FraudSignalType,
  type FraudSeverity,
  type FraudAssessment,
} from './fraud-signal.schema';

// Claim Decision
export {
  ClaimDecisionSchema,
  DecisionOutcomeSchema,
  DenialReasonSchema,
  ReviewReasonSchema,
  RationaleFactorSchema,
  RationaleMetadataSchema,
  DecisionRequestSchema,
  type ClaimDecision,
  type DecisionOutcome,
  type DenialReason,
  type ReviewReason,
  type RationaleFactor,
  type RationaleMetadata,
  type DecisionRequest,
} from './claim-decision.schema';

// Audit Event
export {
  AuditEventSchema,
  AuditEventTypeSchema,
  ActorTypeSchema,
  AuditEventCreateSchema,
  AuditQuerySchema,
  type AuditEvent,
  type AuditEventType,
  type ActorType,
  type AuditEventCreate,
  type AuditQuery,
} from './audit-event.schema';
