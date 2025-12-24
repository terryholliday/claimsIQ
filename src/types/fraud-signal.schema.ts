/**
 * ============================================
 * PROVENIQ CLAIMSIQ - FRAUD SIGNAL SCHEMA
 * ============================================
 * 
 * High-severity flags for fraud detection.
 * Examples: image reuse, location anomaly, velocity abuse
 */

import { z } from 'zod';

/**
 * Fraud Signal Type - Category of fraud indicator
 */
export const FraudSignalTypeSchema = z.enum([
  // Evidence-based signals
  'IMAGE_REUSE',           // Same image used in multiple claims
  'IMAGE_MANIPULATION',    // Evidence of photo editing
  'METADATA_STRIPPED',     // EXIF data intentionally removed
  'TIMESTAMP_ANOMALY',     // Evidence timestamp doesn't match claim
  
  // Location-based signals
  'LOCATION_ANOMALY',      // Incident location doesn't match asset location
  'GEOFENCE_VIOLATION',    // Claim from outside coverage area
  'IMPOSSIBLE_TRAVEL',     // Claimant couldn't have been at location
  
  // Behavioral signals
  'VELOCITY_ABUSE',        // Too many claims in short period
  'PATTERN_MATCH',         // Matches known fraud pattern
  'NETWORK_LINK',          // Connected to known fraud network
  
  // Identity signals
  'IDENTITY_MISMATCH',     // Claimant identity doesn't match records
  'SYNTHETIC_IDENTITY',    // Suspected synthetic identity
  'DEVICE_FINGERPRINT',    // Device linked to previous fraud
  
  // Financial signals
  'AMOUNT_ANOMALY',        // Claimed amount is suspicious
  'ROUND_NUMBER_BIAS',     // Suspiciously round numbers
  'STAGED_LOSS',           // Evidence of staged incident
  
  // Other
  'OTHER',
]);

export type FraudSignalType = z.infer<typeof FraudSignalTypeSchema>;

/**
 * Fraud Signal Severity
 */
export const FraudSeveritySchema = z.enum([
  'CRITICAL',  // Immediate rejection recommended
  'HIGH',      // Manual review required
  'MEDIUM',    // Flag for review
  'LOW',       // Informational
]);

export type FraudSeverity = z.infer<typeof FraudSeveritySchema>;

/**
 * Fraud Signal - Individual fraud indicator
 */
export const FraudSignalSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  
  // Signal classification
  signal_type: FraudSignalTypeSchema,
  severity: FraudSeveritySchema,
  
  // Confidence (0-100)
  confidence: z.number().min(0).max(100),
  
  // Evidence
  description: z.string(),
  evidence_ids: z.array(z.string().uuid()).optional(),
  
  // Detection metadata
  detection_method: z.string(),
  detection_model_version: z.string().optional(),
  
  // Comparison data (for signals like IMAGE_REUSE)
  comparison_claim_ids: z.array(z.string().uuid()).optional(),
  comparison_evidence_ids: z.array(z.string().uuid()).optional(),
  
  // Raw signal data
  raw_signal_data: z.record(z.string(), z.unknown()).optional(),
  
  // Timestamps
  detected_at: z.string().datetime(),
  
  // Review status
  reviewed: z.boolean().default(false),
  reviewed_by: z.string().optional(),
  reviewed_at: z.string().datetime().optional(),
  review_outcome: z.enum(['CONFIRMED', 'DISMISSED', 'ESCALATED']).optional(),
});

export type FraudSignal = z.infer<typeof FraudSignalSchema>;

/**
 * Fraud Assessment - Aggregate fraud analysis for a claim
 */
export const FraudAssessmentSchema = z.object({
  claim_id: z.string().uuid(),
  
  // Overall risk score (0-100)
  risk_score: z.number().min(0).max(100),
  risk_level: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL']),
  
  // All signals
  signals: z.array(FraudSignalSchema),
  
  // Counts by severity
  critical_count: z.number().int().min(0),
  high_count: z.number().int().min(0),
  medium_count: z.number().int().min(0),
  low_count: z.number().int().min(0),
  
  // Recommendation
  auto_reject: z.boolean(),
  requires_review: z.boolean(),
  
  // Timestamps
  assessed_at: z.string().datetime(),
});

export type FraudAssessment = z.infer<typeof FraudAssessmentSchema>;
