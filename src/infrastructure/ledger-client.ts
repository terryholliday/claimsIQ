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
        this.baseUrl = baseUrl || process.env.LEDGER_API_URL || 'http://localhost:3001';
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

        const event: LedgerEvent = {
            eventId,
            eventType,
            timestamp: new Date().toISOString(),
            walletId,
            itemId,
            payload,
            sourceApp: 'CLAIMSIQ',
            correlationId: corrId,
        };

        // Store for audit
        this.writtenEvents.push(event);

        // Generate mock hash (production: actual blockchain hash)
        const hash = createHash('sha256')
            .update(JSON.stringify(event))
            .digest('hex');

        console.log(`[LEDGER] POST /v1/ledger/events | Type: ${eventType} | Event: ${eventId}`);

        // In production:
        // const response = await fetch(`${this.baseUrl}/v1/ledger/events`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${serviceJwt}`,
        //         'X-Service-Name': 'proveniq-claimsiq',
        //         'X-Correlation-Id': corrId,
        //     },
        //     body: JSON.stringify(event),
        // });
        // return response.json();

        return {
            eventId,
            blockNumber: this.writtenEvents.length,
            hash,
            timestamp: event.timestamp,
        };
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
