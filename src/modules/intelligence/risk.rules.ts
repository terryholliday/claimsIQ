/**
 * @file src/modules/intelligence/risk.rules.ts
 * @description CONSTANTS for Deterministic Risk Scoring.
 * These values are LOCKED by regulation.
 */

export const BASE_SCORE = 100;

export const RiskPenalties = {
    OWNERSHIP_GAP: 50,      // If ownership established < 30 days before claim
    LOCATION_MISMATCH: 20,  // If incident location != policy region
    FRAUD_SIGNAL: 100,      // If Ledger verification fails (Ownership/Asset mismatch)
    TAMPERING: 100,         // If metadata/hashes don't match
} as const;

export const Thresholds = {
    AUTO_APPROVE: 90,
    MANUAL_REVIEW: 70,
    // Below 70 is AUTO-REJECT
} as const;
