// src/shared/types.ts

import { type Point } from 'geojson';

// 1. ROOT AGGREGATE
export type ClaimStatus = 'INTAKE' | 'VERIFYING' | 'MANUAL_REVIEW' | 'APPROVED' | 'REJECTED';
export type IncidentType = 'THEFT' | 'DAMAGE';

export interface IncidentVector {
    readonly type: IncidentType;
    readonly location: Point; // Standard GeoJSON
    readonly severity: number; // Integer 1-10
    readonly description_hash: string; // Hash of narrative, not raw text
}

export interface ClaimObject {
    readonly id: string; // UUID
    readonly intake_timestamp: string; // ISO8601
    readonly policy_snapshot_id: string; // Reference to policy state at incident
    readonly claimant_did: string; // Decentralized ID
    readonly asset_id: string; // Proveniq Ledger Asset ID
    readonly incident_vector: IncidentVector;
    readonly status: ClaimStatus;
}

// 2. TRUTH ADAPTER (LEDGER)
export interface LedgerVerificationResult {
    readonly claim_id: string;
    readonly asset_match: boolean; // Asset exists?
    readonly ownership_match: boolean; // Ledger Owner == Claimant?
    readonly provenance_gap: boolean; // Breaks in chain of custody?
    readonly condition_delta: number; // 0.0 - 1.0
    readonly timestamp_verified: string;
}

// 3. FINAL AUTHORITY (DECISION)
export type DecisionOutcome = 'PAY' | 'DENY' | 'FLAG';

export interface DecisionRecord {
    readonly claim_id: string;
    readonly decision: DecisionOutcome;
    readonly confidence_score: number; // 0.00 - 1.00
    readonly regulatory_rationale: string; // Machine-generated defense
    readonly evidence_chain: string[]; // Merkle Proof Hashes
    readonly finalized_at: string;
}

// 4. UTILITY (RESULT PATTERN)
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };
