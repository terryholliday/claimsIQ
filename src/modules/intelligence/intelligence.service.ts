/**
 * @file src/modules/intelligence/intelligence.service.ts
 * @description Intelligence Service - The Authority that signs the decision.
 */

import { ClaimObject, DecisionRecord, LedgerVerificationResult } from '../../shared/types';
import { RiskEngine } from './risk.engine';

export class IntelligenceService {
    private riskEngine: RiskEngine;

    constructor() {
        this.riskEngine = new RiskEngine();
    }

    /**
     * Orchestrates the Intelligence Phase.
     * Consumes Verified Data -> Produces Final Decision.
     * 
     * @param claim The validated Claim Object.
     * @param verification The Trusted Ledger Verification Result.
     * @returns DecisionRecord The binding decision.
     */
    public processClaim(claim: ClaimObject, verification: LedgerVerificationResult): DecisionRecord {
        // 1. Calculate Score & Decision via Deterministic Engine
        const assessment = this.riskEngine.evaluate(claim, verification);

        // 2. Generate Evidence Chain (Placeholder for Merkle Hashes)
        // In production, this would include hashes of the Claim, Ledger Snapshot, and Rule Set.
        const evidenceChain: string[] = [];

        // 3. Construct Final Decision Record
        const decisionRecord: DecisionRecord = {
            claim_id: claim.id,
            decision: assessment.decision,
            confidence_score: assessment.score / 100, // Normalize to 0.0 - 1.0
            regulatory_rationale: assessment.rationale.join(' | '), // Flatten for persistence
            evidence_chain: evidenceChain,
            finalized_at: new Date().toISOString()
        };

        return decisionRecord;
    }
}
