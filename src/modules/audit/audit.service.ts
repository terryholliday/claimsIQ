/**
 * @file src/modules/audit/audit.service.ts
 * @description Audit Service - The Black Box Flight Recorder.
 * Ensures decisions are persisted and tamper-proof (simulated via in-memory lock).
 */

import { DecisionRecord, Result } from '../../shared/types';
import { createHash } from 'crypto';

export class AuditService {
    // In-memory ledger to simulate append-only immutable storage.
    // In production, this would be a Write-Once-Read-Many (WORM) database or Blockchain.
    private readonly _ledger: Map<string, DecisionRecord>;

    constructor() {
        this._ledger = new Map();
    }

    /**
     * Commits a Decision Record to the Audit Log.
     * STRICT: Rejects any attempt to overwrite an existing decision.
     * 
     * @param record The Finalized Decision Record.
     * @returns Result<string> The "Seal" (Hash) of the recorded decision.
     */
    public async commit(record: DecisionRecord): Promise<Result<string>> {
        const claimId = record.claim_id;

        // 1. Check Existence (Idempotency / Anti-Tamper)
        if (this._ledger.has(claimId)) {
            console.warn(`[AUDIT SECURITY] Tamper attempt detected for Claim: ${claimId}`);
            return {
                success: false,
                error: new Error("TAMPER ATTEMPT: Audit record already exists.")
            };
        }

        // 2. "Seal" the Record (Cryptographic Hash)
        // We create a hash of the content to ensure integrity.
        const recordString = JSON.stringify(record);
        const seal = createHash('sha256').update(recordString).digest('hex');

        // 3. Persist (Append Only)
        this._ledger.set(claimId, record);

        // 4. Log
        console.info(`[AUDIT LOCKED] Claim ${claimId} :: Decision ${record.decision} :: Seal ${seal.substring(0, 8)}...`);

        return {
            success: true,
            data: seal
        };
    }

    /**
     * Retrieves a sealed record from the Audit Log.
     * Used by External Systems (Core/Capital) to verify decision status.
     * 
     * @param claimId The ID to look up.
     * @returns Result<DecisionRecord>
     */
    public getRecord(claimId: string): Result<DecisionRecord> {
        const record = this._ledger.get(claimId);

        if (!record) {
            return {
                success: false,
                error: new Error("Claim Not Found in Audit Log")
            };
        }

        return {
            success: true,
            data: record
        };
    }
}
