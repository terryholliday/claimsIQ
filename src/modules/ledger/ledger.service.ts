import { LedgerVerificationResult, Result } from '../../shared/types';
import { LedgerPort } from './ledger.port';

/**
 * Adapter: Deterministic Mock Implementation of the Ledger Interface.
 * @note This will be replaced by the Proveniq Chain RPC Client in Phase 2.
 */
export class LedgerService implements LedgerPort {

    public async verifyAsset(assetId: string, claimantDid: string): Promise<Result<LedgerVerificationResult>> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const timestampVerified = new Date().toISOString();

            // Scenario C: Ghost (Asset does not exist)
            if (assetId.startsWith('asset_ghost_')) {
                return {
                    success: true,
                    data: {
                        claim_id: '', // Context dependent, usually filled by orchestration
                        asset_match: false,
                        ownership_match: false,
                        provenance_gap: true,
                        condition_delta: 0.0,
                        timestamp_verified: timestampVerified,
                    }
                };
            }

            const isStolen = assetId.startsWith('asset_stolen_');

            // Scenario A (Valid) & B (Theft)
            // Both exist on ledger, but ownership differs
            return {
                success: true,
                data: {
                    claim_id: '',
                    asset_match: true,
                    ownership_match: !isStolen, // If stolen, ownership doesn't match claimant
                    provenance_gap: this.calculateProvenanceGap(assetId), // Mock logic
                    condition_delta: 0.05, // Mock degradation
                    timestamp_verified: timestampVerified,
                }
            };

        } catch (error) {
            return {
                success: false,
                error: new Error("Ledger Unreachable")
            };
        }
    }

    /**
     * Mock logic to determine provenance gap based on ID signal.
     * In production, this compares chain history timestamps.
     */
    private calculateProvenanceGap(assetId: string): boolean {
        return assetId.includes('_gap_');
    }
}
