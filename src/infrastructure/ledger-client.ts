/**
 * @file src/infrastructure/ledger-client.ts
 * @description Proveniq Ledger Client for ClaimsIQ
 * 
 * Writes claim lifecycle events to the immutable Ledger.
 * POST /v1/ledger/events
 */

import { createHash, randomUUID } from 'crypto';

export type LedgerEventType =
    | 'claim.created'
    | 'claim.settled'
    | 'salvage.created'
    | 'salvage.listed'
    | 'salvage.recovered'
    | 'custody.changed';

export interface LedgerEvent {
    readonly eventId: string;
    readonly eventType: LedgerEventType;
    readonly timestamp: string;
    readonly walletId: string;
    readonly itemId: string;
    readonly payload: Record<string, unknown>;
    readonly sourceApp: 'CLAIMSIQ';
    readonly correlationId: string;
    readonly previousEventId?: string; // Hash chain
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
        if (process.env.NODE_ENV === 'production') {
            if (!process.env.LEDGER_API_KEY) {
                throw new Error('LEDGER_API_KEY is required in production');
            }
            if (!this.baseUrl.startsWith('https://')) {
                throw new Error('LEDGER_API_URL must use https in production');
            }
        }
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
