/**
 * ============================================
 * PROVENIQ CLAIMSIQ - CLAIM SCHEMA
 * ============================================
 * 
 * CANONICAL SCHEMA: No partial objects.
 * Every inbound payload is "Unverified Suspicion" until validated.
 * 
 * Statuses ONLY: Intake | Verifying | Decisioned | Audit
 */

import { z } from 'zod';

/**
 * Claim Status - Strict state machine
 * No other statuses allowed.
 */
export const ClaimStatusSchema = z.enum([
  'Intake',      // Initial submission, awaiting processing
  'Verifying',   // Ledger verification in progress
  'Decisioned',  // Decision rendered (Pay/Deny/Review)
  'Audit',       // Under audit review
]);

export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

/**
 * Claim Type - Category of claim
 */
export const ClaimTypeSchema = z.enum([
  'DAMAGE',
  'THEFT',
  'LOSS',
  'LIABILITY',
  'OTHER',
]);

export type ClaimType = z.infer<typeof ClaimTypeSchema>;

/**
 * Currency Code - ISO 4217
 */
export const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'GBP', 'USDC']);

export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

/**
 * Monetary Amount - Always in minor units (cents/micros)
 * Explicit currency code required.
 */
export const MonetaryAmountSchema = z.object({
  amount_minor_units: z.bigint(),
  currency: CurrencyCodeSchema,
});

export type MonetaryAmount = z.infer<typeof MonetaryAmountSchema>;

/**
 * Location - Explicit fields, no guessing
 */
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(2).max(3),  // ISO 3166-1 alpha-2 or alpha-3
  postal_code: z.string().optional(),
});

export type Location = z.infer<typeof LocationSchema>;

/**
 * Claim - Core domain entity
 * 
 * TRUTH GATE: All fields validated via Zod.
 * No implicit inference of missing fields.
 */
export const ClaimSchema = z.object({
  // Identity
  id: z.string().uuid(),
  external_id: z.string().optional(),
  
  // Relationships
  policy_id: z.string(),
  asset_id: z.string(),
  claimant_did: z.string(),
  
  // Classification
  claim_type: ClaimTypeSchema,
  status: ClaimStatusSchema,
  
  // Financials - Minor units only
  claimed_amount: MonetaryAmountSchema,
  approved_amount: MonetaryAmountSchema.optional(),
  
  // Description
  description: z.string().min(1).max(10000),
  
  // Location of incident
  incident_location: LocationSchema.optional(),
  
  // Timestamps - ISO 8601 only
  incident_date: z.string().datetime(),
  submitted_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  decisioned_at: z.string().datetime().optional(),
  
  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Claim = z.infer<typeof ClaimSchema>;

/**
 * ClaimIntakePayload - Inbound claim submission
 * "Unverified Suspicion" - must pass validation
 */
export const ClaimIntakePayloadSchema = z.object({
  // Required fields
  policy_id: z.string().min(1),
  asset_id: z.string().min(1),
  claimant_did: z.string().min(1),
  claim_type: ClaimTypeSchema,
  
  // Amount in minor units
  claimed_amount_minor_units: z.number().int().positive(),
  currency: CurrencyCodeSchema,
  
  // Description
  description: z.string().min(10).max(10000),
  
  // Incident details
  incident_date: z.string().datetime(),
  incident_location: LocationSchema.optional(),
  
  // Optional external reference
  external_id: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ClaimIntakePayload = z.infer<typeof ClaimIntakePayloadSchema>;

/**
 * Validation result for intake
 */
export interface ClaimValidationResult {
  valid: boolean;
  claim?: Claim;
  errors?: z.ZodError;
}
