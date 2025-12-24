/**
 * ============================================
 * PROVENIQ CLAIMSIQ - CLAIM SERVICE
 * ============================================
 * 
 * Claim intake and management.
 * Every inbound payload is "Unverified Suspicion" until validated.
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db';
import { ClaimIntakePayloadSchema, type ClaimIntakePayload } from '../types';
import { createAuditEvent } from './audit.service';
import type { Claim, ClaimStatus } from '../generated/prisma';

export interface ClaimIntakeResult {
  success: boolean;
  claim_id?: string;
  correlation_id?: string;
  errors?: Array<{ path: string; message: string }>;
}

/**
 * Ingest a new claim
 * Validates payload, persists to database, creates audit event
 */
export async function ingestClaim(
  payload: unknown,
  actorId: string = 'SYSTEM',
  actorIp?: string
): Promise<ClaimIntakeResult> {
  // Step 1: Validate payload with Zod
  const validation = ClaimIntakePayloadSchema.safeParse(payload);
  
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    
    console.error('[ClaimService] Validation failed:', errors);
    
    return {
      success: false,
      errors,
    };
  }
  
  const data: ClaimIntakePayload = validation.data;
  const correlationId = uuidv4();
  
  try {
    // Step 2: Create claim in database
    const claim = await prisma.claim.create({
      data: {
        policy_id: data.policy_id,
        asset_id: data.asset_id,
        claimant_did: data.claimant_did,
        claim_type: data.claim_type,
        status: 'INTAKE',
        claimed_amount: BigInt(data.claimed_amount_minor_units),
        currency: data.currency,
        description: data.description,
        incident_date: new Date(data.incident_date),
        incident_location: data.incident_location,
        external_id: data.external_id,
        metadata: data.metadata,
        correlation_id: correlationId,
      },
    });
    
    // Step 3: Create audit event
    await createAuditEvent({
      event_type: 'CLAIM_SUBMITTED',
      severity: 'INFO',
      subject_type: 'CLAIM',
      subject_id: claim.id,
      actor_type: 'API',
      actor_id: actorId,
      actor_ip: actorIp,
      description: `Claim submitted for asset ${data.asset_id} under policy ${data.policy_id}`,
      claim_id: claim.id,
      correlation_id: correlationId,
      new_state: {
        status: 'INTAKE',
        claimed_amount: data.claimed_amount_minor_units,
        currency: data.currency,
        claim_type: data.claim_type,
      },
    });
    
    console.log(`[ClaimService] Claim ingested: ${claim.id}`);
    
    return {
      success: true,
      claim_id: claim.id,
      correlation_id: correlationId,
    };
  } catch (error) {
    console.error('[ClaimService] Ingestion failed:', error);
    
    // Create error audit event
    await createAuditEvent({
      event_type: 'SYSTEM_ERROR',
      severity: 'ERROR',
      subject_type: 'CLAIM',
      subject_id: 'UNKNOWN',
      actor_type: 'SYSTEM',
      actor_id: 'CLAIM_SERVICE',
      description: `Claim ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      correlation_id: correlationId,
      metadata: { payload: data },
    }).catch(() => {});
    
    return {
      success: false,
      errors: [{ path: 'system', message: 'Internal error during claim ingestion' }],
    };
  }
}

/**
 * Get claim by ID
 */
export async function getClaimById(claimId: string): Promise<Claim | null> {
  return prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      decision: true,
      evidence: true,
    },
  });
}

/**
 * Update claim status
 */
export async function updateClaimStatus(
  claimId: string,
  newStatus: ClaimStatus,
  actorId: string = 'SYSTEM'
): Promise<Claim> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  const previousStatus = claim.status;
  
  const updated = await prisma.claim.update({
    where: { id: claimId },
    data: {
      status: newStatus,
      decisioned_at: newStatus === 'DECISIONED' ? new Date() : undefined,
    },
  });
  
  // Audit the status change
  await createAuditEvent({
    event_type: 'CLAIM_STATUS_CHANGED',
    severity: 'INFO',
    subject_type: 'CLAIM',
    subject_id: claimId,
    actor_type: 'SYSTEM',
    actor_id: actorId,
    description: `Claim status changed from ${previousStatus} to ${newStatus}`,
    claim_id: claimId,
    correlation_id: claim.correlation_id || undefined,
    previous_state: { status: previousStatus },
    new_state: { status: newStatus },
  });
  
  return updated;
}

/**
 * List claims with pagination
 */
export async function listClaims(options: {
  status?: ClaimStatus;
  limit?: number;
  offset?: number;
}) {
  const { status, limit = 50, offset = 0 } = options;
  
  const where = status ? { status } : {};
  
  const [claims, total] = await Promise.all([
    prisma.claim.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { submitted_at: 'desc' },
    }),
    prisma.claim.count({ where }),
  ]);
  
  return { claims, total, limit, offset };
}
