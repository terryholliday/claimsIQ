
import { ClaimDecision } from './schema';

export interface AdjudicationResult {
    decision: ClaimDecision;
    amount_micros: string;
    currency: string;
}

export class PolicyEngine {
    private readonly protectionActive: boolean;
    private readonly defaultPayoutAmount: string;
    private readonly defaultCurrency: string;

    constructor(env: NodeJS.ProcessEnv = process.env) {
        this.protectionActive = env.DEMO_PROTECTION_ACTIVE === 'true';
        this.defaultPayoutAmount = env.DEMO_CLAIM_PAYOUT_MICROS || '5000000000'; // $5,000.00
        this.defaultCurrency = env.DEMO_CURRENCY || 'USD';

        console.log('[PolicyEngine] Config:', {
            protectionActive: this.protectionActive,
            defaultPayout: this.defaultPayoutAmount,
            currency: this.defaultCurrency
        });
    }

    /**
     * Deterministically evaluate a claim based on the Asset ID and Policy State.
     * For v1.0.1 Demo:
     * - If DEMO_PROTECTION_ACTIVE is true -> PAY
     * - Otherwise -> REVIEW
     */
    public evaluateClaim(assetId: string): AdjudicationResult {
        // In a real system, this would query Core for the asset's policy state.
        // Here, we follow the STRICT deterministic rule from the prompt.

        if (this.protectionActive) {
            console.log(`[PolicyEngine] Asset ${assetId} -> PROTECTION ACTIVE -> PAY`);
            return {
                decision: 'PAY',
                amount_micros: this.defaultPayoutAmount,
                currency: this.defaultCurrency,
            };
        }

        console.log(`[PolicyEngine] Asset ${assetId} -> PROTECTION INACTIVE -> REVIEW`);
        return {
            decision: 'REVIEW',
            amount_micros: '0',
            currency: this.defaultCurrency,
        };
    }
}
