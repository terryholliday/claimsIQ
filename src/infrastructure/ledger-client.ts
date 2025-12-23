/**
 * @file src/infrastructure/ledger-client.ts
 * @description Proveniq Ledger Client for ClaimsIQ
 * 
 * Writes claim lifecycle events to the immutable Ledger.
 * POST /v1/ledger/events/canonical
 * SCHEMA VERSION: 1.0.0 (LOCKED)
 */

import { createHash, randomUUID } from 'crypto';

// Canonical Event Types (Must match Ledger)
export type LedgerEventType =
    | 'CLAIM_INTAKE_RECEIVED'
    | 'CLAIM_PAYOUT_APPROVED'
    | 'CLAIM_DENIAL_ISSUED'
    | 'CLAIM_SALVAGE_INITIATED'
    | 'CLAIM_EVIDENCE_ATTACHED'
    | 'CLAIM_ANALYSIS_COMPLETED'
    | 'CLAIM_FRAUD_SCORED';

export interface LedgerSubject {
    asset_id: string;
    claim_id?: string;
    anchor_id?: string;
    policy_id?: string;
}

export interface LedgerCanonicalEnvelope {
    schema_version: '1.0.0';
    event_type: LedgerEventType;
    occurred_at: string;
    correlation_id: string;
    idempotency_key: string;
    producer: 'claimsiq';
    producer_version: string;
    subject: LedgerSubject;
    payload: Record<string, unknown>;
    canonical_hash_hex: string;
    signatures?: {
        device_sig?: string;
        provider_sig?: string;
    };
}

export interface LedgerWriteResult {
    readonly event_id: string;
    readonly sequence_number: number;
    readonly entry_hash: string;
    readonly committed_at: string;
    readonly schema_version: string;
}

export class LedgerClient {
    private readonly baseUrl: string;
    private readonly writtenEvents: LedgerCanonicalEnvelope[] = []; // For testing/audit

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || process.env.LEDGER_API_URL || 'http://localhost:8006';
    }

    /**
     * Write an event to the Proveniq Ledger
     * POST /v1/ledger/events/canonical
     */
    public async writeEvent(
        eventType: LedgerEventType,
        subject: LedgerSubject,
        payload: Record<string, unknown>,
        correlationId?: string
    ): Promise<LedgerWriteResult> {
        const corrId = correlationId || `corr_${randomUUID()}`;
        const apiKey = process.env.LEDGER_API_KEY || 'default-execution-key';

        // Calculate Payload Hash (SHA256)
        const payloadStr = JSON.stringify(payload);
        const payloadHash = createHash('sha256').update(payloadStr).digest('hex');

        const event: LedgerCanonicalEnvelope = {
            schema_version: '1.0.0',
            event_type: eventType,
            occurred_at: new Date().toISOString(),
            correlation_id: corrId,
            idempotency_key: randomUUID(),
            producer: 'claimsiq',
            producer_version: '1.0.0',
            subject: subject,
            payload: payload,
            canonical_hash_hex: payloadHash,
            // signatures: undefined // Add if we have signing keys
        };

        console.log(`[LEDGER] POST ${this.baseUrl}/api/v1/events/canonical | Type: ${eventType}`);

        try {
            const response = await fetch(`${this.baseUrl}/api/v1/events/canonical`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ledger write failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            // Store for testing/audit
            this.writtenEvents.push(event);

            return {
                event_id: data.event_id,
                sequence_number: data.sequence_number,
                entry_hash: data.entry_hash,
                committed_at: data.committed_at,
                schema_version: data.schema_version,
            };
        } catch (error) {
            console.error('[LEDGER] Write Error:', error);
            // FAIL-LOUD: Propagate error
            throw error;
        }
    }

    /**
     * CLAIM_INTAKE_RECEIVED (was claim.created)
     */
    public async writeClaimCreated(
        claimId: string,
        walletId: string,
        assetId: string,
        incidentType: string,
        claimAmount: number
    ): Promise<LedgerWriteResult> {
        return this.writeEvent(
            'CLAIM_INTAKE_RECEIVED',
            { asset_id: assetId, claim_id: claimId }, // Subject
            {
                claimId,
                walletId,
                incidentType,
                claimAmount,
                status: 'INTAKE',
            }
        );
    }

    /**
     * CLAIM_PAYOUT_APPROVED / CLAIM_DENIAL_ISSUED (was claim.settled)
     */
    public async writeClaimSettled(
        claimId: string,
        walletId: string,
        assetId: string,
        decision: 'PAY' | 'DENY' | 'FLAG',
        settlementAmount?: number,
        seal?: string
    ): Promise<LedgerWriteResult> {
        let eventType: LedgerEventType = 'CLAIM_FRAUD_SCORED'; // Default for FLAG

        if (decision === 'PAY') eventType = 'CLAIM_PAYOUT_APPROVED';
        if (decision === 'DENY') eventType = 'CLAIM_DENIAL_ISSUED';

        return this.writeEvent(
            eventType,
            { asset_id: assetId, claim_id: claimId },
            {
                claimId,
                walletId,
                decision,
                settlementAmount,
                seal,
                settledAt: new Date().toISOString(),
            }
        );
    }

    /**
     * CLAIM_SALVAGE_INITIATED (was custody.changed)
     */
    public async writeCustodyChanged(
        walletId: string,
        itemId: string,
        fromState: string,
        toState: string,
        reason: string
    ): Promise<LedgerWriteResult> {
        return this.writeEvent(
            'CLAIM_SALVAGE_INITIATED',
            { asset_id: itemId },
            {
                walletId,
                fromState,
                toState,
                reason,
            }
        );
    }

    /**
     * Get written events (for testing/audit)
     */
    public getWrittenEvents(): LedgerCanonicalEnvelope[] {
        return [...this.writtenEvents];
    }
}

// Singleton instance
let ledgerClientInstance: LedgerClient | null = null;

export function getLedgerClient(): LedgerClient {
    if (!ledgerClientInstance) {
        ledgerClientInstance = new LedgerClient();
    }
    return ledgerClientInstance;
}

export interface LedgerWriteResult {
    readonly eventId: string;
    readonly blockNumber: number;
    readonly hash: string;
    readonly timestamp: string;
}

export class LedgerClient {
    private readonly baseUrl: string;
    private readonly writtenEvents: LedgerEvent[] = []; // For testing/audit

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || process.env.LEDGER_API_URL || 'http://localhost:8006';
    }

    /**
     * Write an event to the Proveniq Ledger
     * POST /v1/ledger/events
     */
    public async writeEvent(
        eventType: LedgerEventType,
        walletId: string,
        itemId: string,
        payload: Record<string, unknown>,
        correlationId?: string
    ): Promise<LedgerWriteResult> {
        const eventId = `evt_${randomUUID().substring(0, 12)}`;
        const corrId = correlationId || `corr_${randomUUID().substring(0, 8)}`;
        const apiKey = process.env.LEDGER_API_KEY || 'default-execution-key';

        const event = {
            source: 'PROVENIQ_CLAIMSIQ', // Matches API expectation
            event_type: eventType,
            asset_id: itemId,
            actor_id: walletId,
            correlation_id: corrId,
            payload: payload
        };

        console.log(`[LEDGER] POST ${this.baseUrl}/api/v1/events | Type: ${eventType}`);

        try {
            const response = await fetch(`${this.baseUrl}/api/v1/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ledger write failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            // Store for testing/audit if needed, but primary is remote
            this.writtenEvents.push({
                eventId: data.event_id,
                eventType,
                timestamp: data.created_at,
                walletId,
                itemId,
                payload,
                sourceApp: 'CLAIMSIQ',
                correlationId: corrId
            });

            return {
                eventId: data.event_id,
                blockNumber: data.sequence_number,
                hash: data.entry_hash,
                timestamp: data.created_at,
            };
        } catch (error) {
            console.error('[LEDGER] Write Error:', error);
            // In a real system we might queue this for retry.
            // For now, we propagate error to halt the claim if the ledger is unreachable (Strict Mode)
            throw error;
        }
    }

    /**
     * Write claim.created to Ledger
     */
    public async writeClaimCreated(
        claimId: string,
        walletId: string,
        assetId: string,
        incidentType: string,
        claimAmount: number
    ): Promise<LedgerWriteResult> {
        return this.writeEvent('claim.created', walletId, assetId, {
            claimId,
            incidentType,
            claimAmount,
            status: 'INTAKE',
        });
    }

    /**
     * Write claim.settled to Ledger
     */
    public async writeClaimSettled(
        claimId: string,
        walletId: string,
        assetId: string,
        decision: 'PAY' | 'DENY' | 'FLAG',
        settlementAmount?: number,
        seal?: string
    ): Promise<LedgerWriteResult> {
        return this.writeEvent('claim.settled', walletId, assetId, {
            claimId,
            decision,
            settlementAmount,
            seal,
            settledAt: new Date().toISOString(),
        });
    }

    /**
     * Write custody.changed for salvage transfer
     */
    public async writeCustodyChanged(
        walletId: string,
        itemId: string,
        fromState: string,
        toState: string,
        reason: string
    ): Promise<LedgerWriteResult> {
        return this.writeEvent('custody.changed', walletId, itemId, {
            fromState,
            toState,
            reason,
        });
    }

    /**
     * Get written events (for testing/audit)
     */
    public getWrittenEvents(): LedgerEvent[] {
        return [...this.writtenEvents];
    }
}

// Singleton instance
let ledgerClientInstance: LedgerClient | null = null;

export function getLedgerClient(): LedgerClient {
    if (!ledgerClientInstance) {
        ledgerClientInstance = new LedgerClient();
    }
    return ledgerClientInstance;
}
