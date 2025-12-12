import { LedgerVerificationResult, Result } from '../../shared/types';

/**
 * Port: Defines the contract for Ledger Truth Verification.
 * This ensures the domain logic is decoupled from the specific blockchain implementation.
 */
export interface LedgerPort {
    /**
     * Verifies the asset ownership and history on the Proveniq Ledger.
     * @param assetId The immutable asset ID from the claim.
     * @param claimantDid The DID of the user filing the claim.
     * @returns Promise resolving to a Result containing the Verification Data.
     */
    verifyAsset(assetId: string, claimantDid: string): Promise<Result<LedgerVerificationResult>>;
}
