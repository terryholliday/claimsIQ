/**
 * ============================================
 * PROVENIQ CLAIMSIQ - AUDIT SERVICE
 * ============================================
 * 
 * Append-only audit log.
 * Events are NEVER updated or deleted.
 */

import { prisma } from '../db';
import { generateEventHash } from '../utils/crypto';
import type { AuditEventType, Severity, SubjectType, ActorType } from '../generated/prisma';

export interface CreateAuditEventInput {
  event_type: AuditEventType;
  severity: Severity;
  subject_type: SubjectType;
  subject_id: string;
  actor_type: ActorType;
  actor_id: string;
  description: string;
  claim_id?: string;
  previous_state?: Record<string, unknown>;
  new_state?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlation_id?: string;
  actor_ip?: string;
  actor_user_agent?: string;
}

/**
 * Create an immutable audit event
 */
export async function createAuditEvent(input: CreateAuditEventInput): Promise<string> {
  const occurredAt = new Date();
  
  // Get previous event hash for chain integrity
  const lastEvent = await prisma.auditEvent.findFirst({
    orderBy: { sequence_number: 'desc' },
    select: { event_hash: true },
  });
  
  const eventHash = generateEventHash(
    input.event_type,
    input.subject_id,
    occurredAt,
    lastEvent?.event_hash
  );
  
  const event = await prisma.auditEvent.create({
    data: {
      event_type: input.event_type,
      severity: input.severity,
      subject_type: input.subject_type,
      subject_id: input.subject_id,
      actor_type: input.actor_type,
      actor_id: input.actor_id,
      actor_ip: input.actor_ip,
      actor_user_agent: input.actor_user_agent,
      description: input.description,
      previous_state: input.previous_state,
      new_state: input.new_state,
      metadata: input.metadata,
      correlation_id: input.correlation_id,
      occurred_at: occurredAt,
      event_hash: eventHash,
      previous_event_hash: lastEvent?.event_hash,
      claim_id: input.claim_id,
    },
  });
  
  return event.id;
}

/**
 * Get audit trail for a claim
 */
export async function getClaimAuditTrail(claimId: string) {
  return prisma.auditEvent.findMany({
    where: { claim_id: claimId },
    orderBy: { sequence_number: 'asc' },
  });
}

/**
 * Get audit trail by correlation ID
 */
export async function getAuditTrailByCorrelation(correlationId: string) {
  return prisma.auditEvent.findMany({
    where: { correlation_id: correlationId },
    orderBy: { sequence_number: 'asc' },
  });
}
