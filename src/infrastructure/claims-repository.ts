/**
 * @file src/infrastructure/claims-repository.ts
 * @description Repository for persisting and retrieving claims.
 */

import { randomUUID } from 'crypto';
import { getDatabase, ClaimsTable, ShrinkageClaimsTable } from './database';

// === Types ===

export interface DepositClaimInput {
  id: string;
  intake_timestamp: string;
  policy_snapshot_id: string;
  claimant_did: string;
  asset_id: string;
  incident_vector: {
    type: string;
    severity: number;
    description_hash: string;
  };
  claim_type: string;
  lease_id?: string;
  evidence: Record<string, unknown>;
}

export interface ShrinkageClaimInput {
  eventId: string;
  timestamp: string;
  locationId: string;
  businessName?: string;
  productId: string;
  productName?: string;
  quantityLost: number;
  unitCostCents: number;
  totalLossCents: number;
  shrinkageType: string;
  detectedBy: string;
}

export interface ClaimRecord {
  id: string;
  claim_id: string;
  source_app: string;
  claim_type: string;
  status: string;
  claimant_did: string;
  asset_id: string;
  incident_type: string;
  incident_severity: number;
  amount_claimed_cents: number | null;
  decision: string | null;
  audit_seal: string | null;
  intake_timestamp: string;
  created_at: Date;
}

export interface ShrinkageRecord {
  id: string;
  event_id: string;
  correlation_id: string;
  status: string;
  location_id: string;
  business_name: string | null;
  product_id: string;
  product_name: string | null;
  total_loss_cents: number;
  shrinkage_type: string;
  decision: string | null;
  created_at: Date;
}

// === Repository ===

export class ClaimsRepository {
  
  /**
   * Persist a deposit dispute claim from Properties
   */
  async createDepositClaim(input: DepositClaimInput): Promise<ClaimRecord> {
    const db = getDatabase();
    
    const record = await db
      .insertInto('claims')
      .values({
        claim_id: input.id,
        source_app: 'proveniq-properties',
        claim_type: input.claim_type,
        status: 'INTAKE',
        claimant_did: input.claimant_did,
        policy_snapshot_id: input.policy_snapshot_id,
        asset_id: input.asset_id,
        asset_type: 'LEASE',
        incident_type: input.incident_vector.type,
        incident_severity: input.incident_vector.severity,
        incident_description_hash: input.incident_vector.description_hash,
        amount_claimed_cents: (input.evidence as any)?.total_damage_cents || null,
        evidence: JSON.stringify(input.evidence),
        intake_timestamp: input.intake_timestamp,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    console.log(`[CLAIMS-REPO] Deposit claim persisted: ${input.id}`);
    
    return record as unknown as ClaimRecord;
  }

  /**
   * Persist a shrinkage claim from Ops
   */
  async createShrinkageClaim(input: ShrinkageClaimInput, correlationId: string): Promise<ShrinkageRecord> {
    const db = getDatabase();
    
    const record = await db
      .insertInto('shrinkage_claims')
      .values({
        event_id: input.eventId,
        correlation_id: correlationId,
        status: 'INTAKE',
        location_id: input.locationId,
        business_name: input.businessName || null,
        product_id: input.productId,
        product_name: input.productName || null,
        quantity_lost: input.quantityLost,
        unit_cost_cents: input.unitCostCents,
        total_loss_cents: input.totalLossCents,
        shrinkage_type: input.shrinkageType,
        detected_by: input.detectedBy,
        event_timestamp: input.timestamp,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    console.log(`[CLAIMS-REPO] Shrinkage claim persisted: ${input.eventId}`);
    
    return record as unknown as ShrinkageRecord;
  }

  /**
   * Get claim by ID
   */
  async getClaimById(claimId: string): Promise<ClaimRecord | null> {
    const db = getDatabase();
    
    const record = await db
      .selectFrom('claims')
      .selectAll()
      .where('claim_id', '=', claimId)
      .executeTakeFirst();

    return record as unknown as ClaimRecord | null;
  }

  /**
   * Get shrinkage claim by event ID
   */
  async getShrinkageByEventId(eventId: string): Promise<ShrinkageRecord | null> {
    const db = getDatabase();
    
    const record = await db
      .selectFrom('shrinkage_claims')
      .selectAll()
      .where('event_id', '=', eventId)
      .executeTakeFirst();

    return record as unknown as ShrinkageRecord | null;
  }

  /**
   * Update claim decision
   */
  async updateClaimDecision(
    claimId: string,
    decision: string,
    confidence: number,
    rationale: string,
    seal: string,
    amountApprovedCents?: number
  ): Promise<void> {
    const db = getDatabase();
    
    await db
      .updateTable('claims')
      .set({
        status: decision === 'PAY' ? 'APPROVED' : 'DENIED',
        decision,
        decision_confidence: confidence,
        decision_rationale: rationale,
        audit_seal: seal,
        amount_approved_cents: amountApprovedCents || null,
        decision_timestamp: new Date().toISOString(),
        updated_at: new Date(),
      })
      .where('claim_id', '=', claimId)
      .execute();

    console.log(`[CLAIMS-REPO] Claim ${claimId} decision updated: ${decision}`);
  }

  /**
   * List claims by status
   */
  async listClaimsByStatus(status: string, limit: number = 50): Promise<ClaimRecord[]> {
    const db = getDatabase();
    
    const records = await db
      .selectFrom('claims')
      .selectAll()
      .where('status', '=', status)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();

    return records as unknown as ClaimRecord[];
  }

  /**
   * List claims pending decision (for Capital polling)
   */
  async listPendingPayDecisions(limit: number = 50): Promise<ClaimRecord[]> {
    const db = getDatabase();
    
    const records = await db
      .selectFrom('claims')
      .selectAll()
      .where('decision', '=', 'PAY')
      .where('status', '=', 'APPROVED')
      .orderBy('decision_timestamp', 'asc')
      .limit(limit)
      .execute();

    return records as unknown as ClaimRecord[];
  }
}

// Singleton
let repository: ClaimsRepository | null = null;

export function getClaimsRepository(): ClaimsRepository {
  if (!repository) {
    repository = new ClaimsRepository();
  }
  return repository;
}
