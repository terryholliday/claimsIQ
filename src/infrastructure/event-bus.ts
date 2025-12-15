/**
 * @file src/infrastructure/event-bus.ts
 * @description Event Bus Client for ClaimsIQ
 * 
 * Publishes events to the Proveniq event bus (Kafka/Pub-Sub).
 * Production: Replace mock with actual Kafka/Pub-Sub client.
 */

import { createHash, randomUUID } from 'crypto';

export type EventType = 
    | 'claim.created'
    | 'claim.settled'
    | 'salvage.created'
    | 'salvage.listed'
    | 'salvage.recovered';

export interface EventPayload {
    readonly eventId: string;
    readonly eventType: EventType;
    readonly timestamp: string;
    readonly walletId: string;
    readonly itemId?: string;
    readonly claimId?: string;
    readonly payload: Record<string, unknown>;
    readonly sourceApp: 'CLAIMSIQ';
    readonly correlationId: string;
}

export interface EventBusConfig {
    readonly brokerUrl?: string;
    readonly topicPrefix?: string;
}

export class EventBus {
    private readonly config: EventBusConfig;
    private readonly publishedEvents: EventPayload[] = []; // For testing/audit

    constructor(config?: EventBusConfig) {
        this.config = config || {
            brokerUrl: process.env.EVENT_BUS_URL || 'localhost:9092',
            topicPrefix: 'proveniq.',
        };
    }

    /**
     * Publish an event to the event bus
     */
    public async publish(
        eventType: EventType,
        walletId: string,
        payload: Record<string, unknown>,
        options?: { itemId?: string; claimId?: string; correlationId?: string }
    ): Promise<string> {
        const eventId = `evt_${randomUUID().substring(0, 12)}`;
        const correlationId = options?.correlationId || `corr_${randomUUID().substring(0, 8)}`;

        const event: EventPayload = {
            eventId,
            eventType,
            timestamp: new Date().toISOString(),
            walletId,
            itemId: options?.itemId,
            claimId: options?.claimId,
            payload,
            sourceApp: 'CLAIMSIQ',
            correlationId,
        };

        // Store for audit/testing
        this.publishedEvents.push(event);

        // Mock publish (production: Kafka/Pub-Sub)
        const topic = `${this.config.topicPrefix}${eventType}`;
        console.log(`[EVENT BUS] Published to ${topic}:`, JSON.stringify({
            eventId,
            eventType,
            claimId: options?.claimId,
            walletId,
        }));

        // In production:
        // await this.kafkaProducer.send({
        //     topic,
        //     messages: [{ key: walletId, value: JSON.stringify(event) }],
        // });

        return eventId;
    }

    /**
     * Publish claim.created event
     */
    public async publishClaimCreated(
        claimId: string,
        walletId: string,
        assetId: string,
        incidentType: string,
        claimAmount: number
    ): Promise<string> {
        return this.publish('claim.created', walletId, {
            claimId,
            assetId,
            incidentType,
            claimAmount,
            status: 'INTAKE',
        }, { claimId, itemId: assetId });
    }

    /**
     * Publish claim.settled event
     */
    public async publishClaimSettled(
        claimId: string,
        walletId: string,
        assetId: string,
        decision: 'PAY' | 'DENY' | 'FLAG',
        settlementAmount?: number
    ): Promise<string> {
        return this.publish('claim.settled', walletId, {
            claimId,
            assetId,
            decision,
            settlementAmount,
            settledAt: new Date().toISOString(),
        }, { claimId, itemId: assetId });
    }

    /**
     * Publish salvage.created event
     */
    public async publishSalvageCreated(
        manifestId: string,
        claimId: string,
        walletId: string,
        assetIds: string[],
        estimatedRecovery: number
    ): Promise<string> {
        return this.publish('salvage.created', walletId, {
            manifestId,
            claimId,
            assetIds,
            estimatedRecovery,
        }, { claimId });
    }

    /**
     * Publish salvage.listed event
     */
    public async publishSalvageListed(
        manifestId: string,
        claimId: string,
        walletId: string,
        bidsListingIds: string[]
    ): Promise<string> {
        return this.publish('salvage.listed', walletId, {
            manifestId,
            claimId,
            bidsListingIds,
            listedAt: new Date().toISOString(),
        }, { claimId });
    }

    /**
     * Publish salvage.recovered event
     */
    public async publishSalvageRecovered(
        manifestId: string,
        claimId: string,
        walletId: string,
        salePrice: number,
        buyerWalletId: string,
        ledgerEventId: string
    ): Promise<string> {
        return this.publish('salvage.recovered', walletId, {
            manifestId,
            claimId,
            salePrice,
            buyerWalletId,
            ledgerEventId,
            recoveredAt: new Date().toISOString(),
        }, { claimId });
    }

    /**
     * Get published events (for testing/audit)
     */
    public getPublishedEvents(): EventPayload[] {
        return [...this.publishedEvents];
    }

    /**
     * Clear published events (for testing)
     */
    public clearEvents(): void {
        this.publishedEvents.length = 0;
    }
}

// Singleton instance
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
    if (!eventBusInstance) {
        eventBusInstance = new EventBus();
    }
    return eventBusInstance;
}
