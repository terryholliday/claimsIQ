/**
 * @file src/modules/intelligence/risk.engine.ts
 * @description Pure Deterministic Scoring Engine.
 */

import { ClaimObject, DecisionOutcome, LedgerVerificationResult } from '../../shared/types';
import { BASE_SCORE, RiskPenalties, Thresholds } from './risk.rules';

export interface RiskAssessment {
    score: number;
    decision: DecisionOutcome;
    rationale: string[];
}

export class RiskEngine {
    /**
     * Calculates specific risk score based on inputs.
     * f(Claim, Ledger) = RiskAssessment
     */
    public evaluate(claim: ClaimObject, verification: LedgerVerificationResult): RiskAssessment {
        let score = BASE_SCORE;
        const rationale: string[] = [];

        // 1. HARD GATE: Critical Fraud Check (Ledger Authority)
        // If Asset or Ownership fails, score is ZERO. Immediate Rejection.
        if (!verification.asset_match || !verification.ownership_match) {
            score = 0;
            rationale.push('CRITICAL: Ledger Mismatch (Fraud Vector)');

            return {
                score,
                decision: 'DENY',
                rationale
            };
        }

        // If we pass the Hard Gate, we start deducting from Base Score.

        // 2. SOFT GATE: Provenance Gap (Ownership Stability)
        if (verification.provenance_gap) {
            score -= RiskPenalties.OWNERSHIP_GAP;
            rationale.push(`Risk: Recent ownership volatility (-${RiskPenalties.OWNERSHIP_GAP})`);
        }

        // 3. Location Mismatch (Mock Policy Check)
        if (claim.incident_vector.description_hash.includes('bad_loc')) {
            score -= RiskPenalties.LOCATION_MISMATCH;
            rationale.push(`Risk: Incident location mismatch with policy region (-${RiskPenalties.LOCATION_MISMATCH})`);
        }

        // 4. Floor Check (Score cannot be < 0)
        score = Math.max(0, score);

        // 5. Decision Mapping
        // >= 90: PAY
        // 70-89: FLAG
        // < 70: DENY
        let decision: DecisionOutcome = 'DENY';
        if (score >= Thresholds.AUTO_APPROVE) {
            decision = 'PAY';
        } else if (score >= Thresholds.MANUAL_REVIEW) {
            decision = 'FLAG';
        }

        return {
            score,
            decision,
            rationale
        };
    }
}
