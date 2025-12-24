import { LedgerVerificationResult, Result } from '../../shared/types';
import { LedgerPort } from './ledger.port';

/**
 * Adapter: Deterministic Mock Implementation of the Ledger Interface.
 * @note This will be replaced by the Proveniq Chain RPC Client in Phase 2.
 */
export class LedgerService implements LedgerPort {

    public async verifyAsset(assetId: string, claimantDid: string): Promise<Result<LedgerVerificationResult>> {
        const apiUrl = process.env.LEDGER_API_URL || 'http://localhost:8006';
        const apiKey = process.env.LEDGER_API_KEY || 'default-execution-key';

        try {
            console.log(`[LEDGER-SVC] Verifying asset ${assetId} against ${apiUrl}...`);

            // 1. Fetch Asset History
            const response = await fetch(`${apiUrl}/api/v1/assets/${assetId}/events?limit=100`, {
                headers: {
                    'x-api-key': apiKey
                }
            });

            if (response.status === 404) {
                return {
                    success: true,
                    data: {
                        claim_id: '',
                        asset_match: false, // Asset not found on ledger
                        ownership_match: false,
                        provenance_gap: true,
                        condition_delta: 0.0,
                        timestamp_verified: new Date().toISOString(),
                    }
                };
            }

            if (!response.ok) {
                throw new Error(`Ledger error: ${response.status}`);
            }

            const data = await response.json();
            const events = data.events || [];

            if (events.length === 0) {
                return {
                    success: true,
                    data: {
                        claim_id: '',
                        asset_match: false, // IDs exist but no events? Treat as ghost.
                        ownership_match: false,
                        provenance_gap: true,
                        condition_delta: 0.0,
                        timestamp_verified: new Date().toISOString(),
                    }
                };
            }

            // 2. Determine Current Owner
            // We look for the most recent 'custody.changed' or 'asset.registered' (creation)
            // Simplified logic: The 'actor_id' (walletId) of the last relevant event is the owner.
            // Or look for specific 'new_owner' in payload if the event schema defines it.
            // For V1, we assume the AUTHOR of the last event is the OWNER unless specified otherwise.
            const lastEvent = events[0]; // Ordered by sequence_number DESC

            // Check if last event indicates stolen or lost?
            // If the last event was reporting it stolen, ownership might still be valid but status is bad.

            // Basic ownership match: Does the claimant's DID match the last known owner?
            // In a real system we'd parse the chain state.
            // Here we check if the last actor was the claimant.

            let ownerOnLedger = lastEvent.actor_id;

            // If the last event explicitly has 'new_owner' or 'owner' in payload, use that.
            if (lastEvent.payload && (lastEvent.payload as any).toState) {
                // Custody change event logic would go here.
            }

            const ownershipMatch = (ownerOnLedger === claimantDid);

            return {
                success: true,
                data: {
                    claim_id: '',
                    asset_match: true,
                    ownership_match: ownershipMatch,
                    provenance_gap: false, // Real calculation would check timestamps continuity
                    condition_delta: 0.0, // Placeholder
                    timestamp_verified: new Date().toISOString(),
                }
            };

        } catch (error) {
            console.error('[LEDGER-SVC] Verification failed:', error);
            // Fail SAFE: If we can't talk to the ledger, we cannot verify. 
            // In insurance, failing strictly is better than paying fraud.
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Ledger Verification Failed")
            };
        }
    }

    /**
     * Mock logic removed.
     */
    private calculateProvenanceGap(assetId: string): boolean {
        return false;
    }
}
