/**
 * ============================================
 * PROVENIQ CLAIMSIQ - CRYPTOGRAPHIC UTILITIES
 * ============================================
 * 
 * Hash generation for audit signatures.
 * Used to create immutable audit trails.
 */

import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash of data
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Generate audit signature for a record
 * Combines all relevant fields into a deterministic hash
 */
export function generateAuditSignature(data: Record<string, unknown>): string {
  const sortedData = JSON.stringify(data, Object.keys(data).sort());
  return sha256(sortedData);
}

/**
 * Generate event hash for audit chain
 */
export function generateEventHash(
  eventType: string,
  subjectId: string,
  occurredAt: Date,
  previousHash?: string
): string {
  const payload = `${eventType}:${subjectId}:${occurredAt.toISOString()}:${previousHash || 'GENESIS'}`;
  return sha256(payload);
}
