/**
 * @file src/modules/intelligence/decision-engine.ts
 * @description Decision Engine for automated claim processing.
 * 
 * DETERMINISTIC LOGIC:
 * - PAY: Claim meets all criteria
 * - DENY: Claim fails validation
 * - REVIEW: Edge cases require human review
 */

import { createHash } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export type Decision = 'PAY' | 'DENY' | 'REVIEW';

export interface ClaimData {
  claim_id: string;
  claim_type: string;
  source_app: string;
  claimant_did: string;
  asset_id: string;
  incident_type: string;
  incident_severity: number;
  amount_claimed_cents: number;
  evidence: {
    evidence_hashes?: string[];
    inspection_hashes?: string[];
    total_damage_cents?: number;
    deposit_amount_cents?: number;
    [key: string]: unknown;
  };
}

export interface DecisionResult {
  decision: Decision;
  confidence: number;
  rationale: string;
  amount_approved_cents: number;
  audit_seal: string;
  flags: string[];
}

// =============================================================================
// DECISION ENGINE
// =============================================================================

export class DecisionEngine {
  
  /**
   * Process a claim and return a decision
   */
  async processClaimDecision(claim: ClaimData): Promise<DecisionResult> {
    const flags: string[] = [];
    let confidence = 100;
    
    // === GATE 1: Evidence Check ===
    const evidenceScore = this.scoreEvidence(claim);
    if (evidenceScore < 50) {
      return this.deny(claim, 'Insufficient evidence', evidenceScore, ['LOW_EVIDENCE']);
    }
    if (evidenceScore < 80) {
      flags.push('PARTIAL_EVIDENCE');
      confidence -= 20;
    }

    // === GATE 2: Amount Validation ===
    const amountCheck = this.validateAmount(claim);
    if (!amountCheck.valid) {
      return this.deny(claim, amountCheck.reason, 95, ['AMOUNT_INVALID']);
    }
    if (amountCheck.flags.length > 0) {
      flags.push(...amountCheck.flags);
      confidence -= 10;
    }

    // === GATE 3: Fraud Signals ===
    const fraudScore = this.checkFraudSignals(claim);
    if (fraudScore > 70) {
      return this.deny(claim, 'Fraud signals detected', 90, ['FRAUD_DETECTED']);
    }
    if (fraudScore > 30) {
      flags.push('ELEVATED_FRAUD_RISK');
      confidence -= 15;
    }

    // === GATE 4: Claim Type Specific Rules ===
    const typeResult = this.applyClaimTypeRules(claim);
    if (typeResult.action === 'DENY') {
      return this.deny(claim, typeResult.reason, typeResult.confidence, typeResult.flags);
    }
    if (typeResult.action === 'REVIEW') {
      return this.review(claim, typeResult.reason, typeResult.confidence, typeResult.flags);
    }
    flags.push(...typeResult.flags);
    confidence = Math.min(confidence, typeResult.confidence);

    // === GATE 5: Amount Determination ===
    const approvedAmount = this.calculateApprovedAmount(claim);

    // === DECISION: PAY ===
    if (confidence >= 70) {
      return this.pay(claim, approvedAmount, confidence, flags);
    }

    // === FALLBACK: REVIEW ===
    return this.review(claim, 'Confidence below threshold', confidence, flags);
  }

  // ===========================================================================
  // SCORING FUNCTIONS
  // ===========================================================================

  private scoreEvidence(claim: ClaimData): number {
    let score = 0;
    const evidence = claim.evidence;

    // Evidence hashes present
    if (evidence.evidence_hashes && evidence.evidence_hashes.length > 0) {
      score += 30;
      if (evidence.evidence_hashes.length >= 3) score += 10;
      if (evidence.evidence_hashes.length >= 5) score += 10;
    }

    // Inspection hashes (Properties claims)
    if (evidence.inspection_hashes && evidence.inspection_hashes.length >= 2) {
      score += 30; // Both move-in and move-out
    }

    // Documented damage amounts
    if (evidence.total_damage_cents && evidence.total_damage_cents > 0) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  private validateAmount(claim: ClaimData): { valid: boolean; reason: string; flags: string[] } {
    const flags: string[] = [];
    
    if (claim.amount_claimed_cents <= 0) {
      return { valid: false, reason: 'No amount claimed', flags: ['ZERO_AMOUNT'] };
    }

    // Check against deposit (for deposit disputes)
    if (claim.evidence.deposit_amount_cents) {
      if (claim.amount_claimed_cents > claim.evidence.deposit_amount_cents) {
        flags.push('EXCEEDS_DEPOSIT');
      }
    }

    // High value claims need review
    if (claim.amount_claimed_cents > 1000000) { // > $10,000
      flags.push('HIGH_VALUE_CLAIM');
    }

    return { valid: true, reason: '', flags };
  }

  private checkFraudSignals(claim: ClaimData): number {
    let fraudScore = 0;

    // Severity vs amount mismatch
    if (claim.incident_severity <= 3 && claim.amount_claimed_cents > 500000) {
      fraudScore += 30; // Low severity, high claim
    }

    // Missing claimant DID
    if (!claim.claimant_did || claim.claimant_did === '') {
      fraudScore += 40;
    }

    // Suspicious claim types
    if (claim.incident_type === 'UNKNOWN') {
      fraudScore += 20;
    }

    return fraudScore;
  }

  private applyClaimTypeRules(claim: ClaimData): {
    action: 'PAY' | 'DENY' | 'REVIEW' | 'CONTINUE';
    reason: string;
    confidence: number;
    flags: string[];
  } {
    const flags: string[] = [];

    switch (claim.claim_type) {
      case 'DEPOSIT_DISPUTE':
        // Must have both inspections
        if (!claim.evidence.inspection_hashes || claim.evidence.inspection_hashes.length < 2) {
          return { action: 'DENY', reason: 'Missing move-in/out inspections', confidence: 95, flags: ['MISSING_INSPECTIONS'] };
        }
        return { action: 'CONTINUE', reason: '', confidence: 90, flags };

      case 'STR_GUEST_DAMAGE':
        // Must have evidence
        if (!claim.evidence.evidence_hashes || claim.evidence.evidence_hashes.length === 0) {
          return { action: 'DENY', reason: 'No damage evidence provided', confidence: 95, flags: ['NO_EVIDENCE'] };
        }
        return { action: 'CONTINUE', reason: '', confidence: 85, flags };

      case 'SHRINKAGE':
        // Auto-approve small shrinkage
        if (claim.amount_claimed_cents < 50000) { // < $500
          return { action: 'CONTINUE', reason: '', confidence: 95, flags: ['AUTO_APPROVE_SMALL'] };
        }
        // Large shrinkage needs review
        flags.push('LARGE_SHRINKAGE');
        return { action: 'CONTINUE', reason: '', confidence: 70, flags };

      case 'INSURANCE':
      case 'WARRANTY':
        // Home claims - check provenance
        return { action: 'CONTINUE', reason: '', confidence: 80, flags };

      default:
        return { action: 'REVIEW', reason: 'Unknown claim type', confidence: 50, flags: ['UNKNOWN_TYPE'] };
    }
  }

  private calculateApprovedAmount(claim: ClaimData): number {
    // For deposit disputes, cap at deposit amount
    if (claim.claim_type === 'DEPOSIT_DISPUTE' && claim.evidence.deposit_amount_cents) {
      return Math.min(claim.amount_claimed_cents, claim.evidence.deposit_amount_cents);
    }

    // For shrinkage, approve full amount
    if (claim.claim_type === 'SHRINKAGE') {
      return claim.amount_claimed_cents;
    }

    // Default: approve claimed amount
    return claim.amount_claimed_cents;
  }

  // ===========================================================================
  // DECISION BUILDERS
  // ===========================================================================

  private pay(claim: ClaimData, amount: number, confidence: number, flags: string[]): DecisionResult {
    return {
      decision: 'PAY',
      confidence,
      rationale: `Claim approved. Evidence score sufficient. Amount: $${(amount / 100).toFixed(2)}`,
      amount_approved_cents: amount,
      audit_seal: this.generateSeal(claim, 'PAY', amount),
      flags,
    };
  }

  private deny(claim: ClaimData, reason: string, confidence: number, flags: string[]): DecisionResult {
    return {
      decision: 'DENY',
      confidence,
      rationale: `Claim denied: ${reason}`,
      amount_approved_cents: 0,
      audit_seal: this.generateSeal(claim, 'DENY', 0),
      flags,
    };
  }

  private review(claim: ClaimData, reason: string, confidence: number, flags: string[]): DecisionResult {
    return {
      decision: 'REVIEW',
      confidence,
      rationale: `Manual review required: ${reason}`,
      amount_approved_cents: 0,
      audit_seal: this.generateSeal(claim, 'REVIEW', 0),
      flags: [...flags, 'MANUAL_REVIEW'],
    };
  }

  private generateSeal(claim: ClaimData, decision: string, amount: number): string {
    const payload = JSON.stringify({
      claim_id: claim.claim_id,
      decision,
      amount,
      timestamp: new Date().toISOString(),
    });
    return createHash('sha256').update(payload).digest('hex');
  }
}

// Singleton
let engine: DecisionEngine | null = null;

export function getDecisionEngine(): DecisionEngine {
  if (!engine) {
    engine = new DecisionEngine();
  }
  return engine;
}
