/**
 * ============================================
 * PROVENIQ CLAIMSIQ - EVIDENCE SCHEMA
 * ============================================
 * 
 * Evidence attached to claims.
 * All evidence is "Unverified" until processed.
 */

import { z } from 'zod';

/**
 * Evidence Type
 */
export const EvidenceTypeSchema = z.enum([
  'PHOTO',
  'VIDEO',
  'DOCUMENT',
  'RECEIPT',
  'POLICE_REPORT',
  'WITNESS_STATEMENT',
  'APPRAISAL',
  'OTHER',
]);

export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

/**
 * Evidence Status
 */
export const EvidenceStatusSchema = z.enum([
  'PENDING',     // Awaiting processing
  'VERIFIED',    // Passed verification
  'FLAGGED',     // Flagged for review
  'REJECTED',    // Failed verification
]);

export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

/**
 * Evidence - Supporting documentation for a claim
 */
export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  
  // Type and status
  evidence_type: EvidenceTypeSchema,
  status: EvidenceStatusSchema,
  
  // Source
  source_url: z.string().url(),
  source_hash: z.string(),  // SHA-256 hash of content
  
  // Metadata
  file_name: z.string().optional(),
  file_size_bytes: z.number().int().positive().optional(),
  mime_type: z.string().optional(),
  
  // Capture metadata
  captured_at: z.string().datetime().optional(),
  captured_location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  
  // Device metadata (for fraud detection)
  device_id: z.string().optional(),
  device_type: z.string().optional(),
  
  // Timestamps
  submitted_at: z.string().datetime(),
  verified_at: z.string().datetime().optional(),
  
  // Verification notes
  verification_notes: z.string().optional(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

/**
 * Evidence Intake Payload
 */
export const EvidenceIntakePayloadSchema = z.object({
  claim_id: z.string().uuid(),
  evidence_type: EvidenceTypeSchema,
  source_url: z.string().url(),
  source_hash: z.string().min(64).max(64),  // SHA-256
  
  // Optional metadata
  file_name: z.string().optional(),
  file_size_bytes: z.number().int().positive().optional(),
  mime_type: z.string().optional(),
  captured_at: z.string().datetime().optional(),
  captured_location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  device_id: z.string().optional(),
  device_type: z.string().optional(),
});

export type EvidenceIntakePayload = z.infer<typeof EvidenceIntakePayloadSchema>;
