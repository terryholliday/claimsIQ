/**
 * ============================================
 * PROVENIQ CLAIMSIQ - LEDGER VERIFICATION SCHEMA
 * ============================================
 * 
 * Links Claim to Proveniq Ledger Asset ID.
 * MUST include discrepancy_vector (array/object describing exact mismatches).
 * Do NOT use only boolean is_match.
 */

import { z } from 'zod';

/**
 * Discrepancy Type - What kind of mismatch was found
 */
export const DiscrepancyTypeSchema = z.enum([
  'OWNER_MISMATCH',        // Claimant does not own the asset
  'ASSET_NOT_FOUND',       // Asset ID not in ledger
  'POLICY_MISMATCH',       // Policy does not cover this asset
  'COVERAGE_EXPIRED',      // Policy coverage has expired
  'COVERAGE_NOT_STARTED',  // Policy coverage not yet active
  'AMOUNT_EXCEEDS_LIMIT',  // Claimed amount exceeds policy limit
  'DUPLICATE_CLAIM',       // Claim already exists for this incident
  'ASSET_STATUS_INVALID',  // Asset is not in claimable status
  'LOCATION_MISMATCH',     // Incident location outside coverage area
  'OTHER',                 // Other discrepancy
]);

export type DiscrepancyType = z.infer<typeof DiscrepancyTypeSchema>;

/**
 * Discrepancy - Single mismatch between claim and ledger
 */
export const DiscrepancySchema = z.object({
  type: DiscrepancyTypeSchema,
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  
  // What was expected vs what was found
  expected_value: z.string(),
  actual_value: z.string(),
  
  // Human-readable description
  description: z.string(),
  
  // Source of truth
  ledger_field: z.string(),
  claim_field: z.string(),
});

export type Discrepancy = z.infer<typeof DiscrepancySchema>;

/**
 * Ledger Asset - Data retrieved from Proveniq Ledger
 */
export const LedgerAssetSchema = z.object({
  asset_id: z.string(),
  owner_did: z.string(),
  asset_type: z.string(),
  asset_status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DESTROYED']),
  
  // Policy information
  policy_id: z.string().optional(),
  policy_status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING']).optional(),
  coverage_start: z.string().datetime().optional(),
  coverage_end: z.string().datetime().optional(),
  coverage_limit_minor_units: z.bigint().optional(),
  coverage_currency: z.string().optional(),
  
  // Location
  registered_location: z.object({
    country: z.string(),
    region: z.string().optional(),
  }).optional(),
  
  // Metadata
  last_updated: z.string().datetime(),
  ledger_hash: z.string(),
});

export type LedgerAsset = z.infer<typeof LedgerAssetSchema>;

/**
 * LedgerVerification - Result of verifying claim against ledger
 * 
 * CRITICAL: Uses discrepancy_vector, NOT just boolean is_match
 */
export const LedgerVerificationSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  
  // Verification result
  verified: z.boolean(),
  verification_status: z.enum(['MATCH', 'CONFLICT', 'PARTIAL', 'NOT_FOUND']),
  
  // Discrepancy vector - REQUIRED
  // Empty array means no discrepancies (verified = true)
  discrepancy_vector: z.array(DiscrepancySchema),
  
  // Ledger data snapshot
  ledger_asset: LedgerAssetSchema.optional(),
  
  // Confidence score (0-100)
  confidence_score: z.number().min(0).max(100),
  
  // Timestamps
  verified_at: z.string().datetime(),
  ledger_query_latency_ms: z.number().int().positive(),
  
  // Audit trail
  ledger_transaction_hash: z.string().optional(),
});

export type LedgerVerification = z.infer<typeof LedgerVerificationSchema>;

/**
 * LedgerResult - Response from Ledger API
 */
export const LedgerResultSchema = z.object({
  success: z.boolean(),
  asset: LedgerAssetSchema.optional(),
  error: z.string().optional(),
  query_time_ms: z.number().int().positive(),
  transaction_hash: z.string().optional(),
});

export type LedgerResult = z.infer<typeof LedgerResultSchema>;
