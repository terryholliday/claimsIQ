
import { ClaimDecision } from "./schema";

export interface PolicyDecision {
    decision: ClaimDecision;
    amount_micros: string;
    currency: string;
    reason: string;
}

const DEMO_PAYOUT_MICROS = process.env.DEMO_CLAIM_PAYOUT_MICROS || "5000000000"; // $5,000.00
const DEMO_CURRENCY = process.env.DEMO_CURRENCY || "USD";
const PROTECTION_ACTIVE = process.env.DEMO_PROTECTION_ACTIVE === "true";

export function evaluateClaim(triggerType: string, assetId: string): PolicyDecision {
    // Deterministic Logic for Demo

    // Only pay on ANCHOR_SEAL_BROKEN if protection is active
    if (triggerType === "ANCHOR_SEAL_BROKEN") {
        if (PROTECTION_ACTIVE) {
            return {
                decision: "PAY",
                amount_micros: DEMO_PAYOUT_MICROS,
                currency: DEMO_CURRENCY,
                reason: "Automated Approval: Seal Breach detected on Protected Asset."
            };
        } else {
            return {
                decision: "REVIEW",
                amount_micros: "0",
                currency: DEMO_CURRENCY,
                reason: "Flagged for Review: Seal Breach detected but Protection Inactive."
            };
        }
    }

    // Default reject/review other triggers
    return {
        decision: "REVIEW",
        amount_micros: "0",
        currency: DEMO_CURRENCY,
        reason: `Manual Review Required: Trigger ${triggerType} not auto-adjudicated.`
    };
}
