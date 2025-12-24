/**
 * @file src/infrastructure/event-consumer.ts
 * @description Event Consumer for ClaimsIQ
 * 
 * Consumes events from the Proveniq event bus per DNA Contract Section 6.2:
 * - genome.verified → Update claim evidence package
 * - score.updated → Recalculate claim readiness
 * - fraud.flagged → Flag claim for manual review
 * - auction.settled → Update salvage recovery status
 * - vehicle.documented → Link pre-loss vehicle photos to claim
 * - warranty.registered → Index warranty for subrogation
 * - warranty.claimed → Cross-reference for dual-dip fraud detection
 */

import { WarrantyService } from '../modules/warranty/warranty.service';
import { ProvenanceService } from '../modules/provenance/provenance.service';

export interface EventPayload {
    readonly eventId: string;
    readonly eventType: string;
    readonly timestamp: string;
    readonly walletId: string;
    readonly itemId?: string;
    readonly claimId?: string;
    readonly payload: Record<string, unknown>;
    readonly correlationId: string;
}

export class EventConsumer {
    private readonly warrantyService: WarrantyService;
    private readonly provenanceService: ProvenanceService;
    private readonly claimEvidenceIndex: Map<string, { genomeVerified: boolean; scoreUpdated: boolean; fraudFlagged: boolean }>;

    constructor() {
        this.warrantyService = new WarrantyService();
        this.provenanceService = new ProvenanceService();
        this.claimEvidenceIndex = new Map();
    }

    /**
     * Main event handler - routes events to appropriate handlers
     */
    public async handleEvent(event: EventPayload): Promise<void> {
        console.log(`[EVENT CONSUMER] Received ${event.eventType} | Event: ${event.eventId}`);

        switch (event.eventType) {
            case 'genome.verified':
                await this.handleGenomeVerified(event);
                break;
            case 'score.updated':
                await this.handleScoreUpdated(event);
                break;
            case 'fraud.flagged':
                await this.handleFraudFlagged(event);
                break;
            case 'auction.settled':
                await this.handleAuctionSettled(event);
                break;
            case 'vehicle.documented':
                await this.handleVehicleDocumented(event);
                break;
            case 'warranty.registered':
                await this.handleWarrantyRegistered(event);
                break;
            case 'warranty.claimed':
                await this.handleWarrantyClaimed(event);
                break;
            default:
                console.log(`[EVENT CONSUMER] Ignoring unsubscribed event: ${event.eventType}`);
        }
    }

    /**
     * genome.verified → Update claim evidence package
     */
    private async handleGenomeVerified(event: EventPayload): Promise<void> {
        const itemId = event.itemId;
        if (!itemId) return;

        // Update provenance index
        this.provenanceService.updateItem(itemId, {
            genomeVerified: true,
            lastVerifiedAt: event.timestamp,
        });

        // Update any active claims for this item
        const evidence = this.claimEvidenceIndex.get(itemId) || { genomeVerified: false, scoreUpdated: false, fraudFlagged: false };
        evidence.genomeVerified = true;
        this.claimEvidenceIndex.set(itemId, evidence);

        console.log(`[EVENT CONSUMER] Genome verified for item ${itemId}`);
    }

    /**
     * score.updated → Recalculate claim readiness
     */
    private async handleScoreUpdated(event: EventPayload): Promise<void> {
        const itemId = event.itemId;
        const newScore = event.payload.score as number;
        if (!itemId) return;

        this.provenanceService.updateItem(itemId, {
            provenanceScore: newScore,
        });

        const evidence = this.claimEvidenceIndex.get(itemId) || { genomeVerified: false, scoreUpdated: false, fraudFlagged: false };
        evidence.scoreUpdated = true;
        this.claimEvidenceIndex.set(itemId, evidence);

        console.log(`[EVENT CONSUMER] Score updated for item ${itemId}: ${newScore}`);
    }

    /**
     * fraud.flagged → Flag claim for manual review
     */
    private async handleFraudFlagged(event: EventPayload): Promise<void> {
        const itemId = event.itemId;
        const fraudType = event.payload.fraudType as string;
        if (!itemId) return;

        const evidence = this.claimEvidenceIndex.get(itemId) || { genomeVerified: false, scoreUpdated: false, fraudFlagged: false };
        evidence.fraudFlagged = true;
        this.claimEvidenceIndex.set(itemId, evidence);

        // In production: Update claim status, notify SIU, create audit trail
        console.log(`[EVENT CONSUMER] FRAUD FLAGGED for item ${itemId}: ${fraudType}`);
    }

    /**
     * auction.settled → Update salvage recovery status
     */
    private async handleAuctionSettled(event: EventPayload): Promise<void> {
        const listingId = event.payload.listingId as string;
        const salePrice = event.payload.salePrice as number;
        const buyerWalletId = event.payload.buyerWalletId as string;

        // In production: Update salvage manifest, record recovery in Ledger
        console.log(`[EVENT CONSUMER] Auction settled: ${listingId} for $${salePrice}`);
    }

    /**
     * vehicle.documented → Link pre-loss vehicle photos to claim
     */
    private async handleVehicleDocumented(event: EventPayload): Promise<void> {
        const itemId = event.itemId;
        const photoCount = event.payload.photoCount as number;
        const photoCompleteness = event.payload.photoCompleteness as number;
        if (!itemId) return;

        this.provenanceService.updateItem(itemId, {
            photoCount,
        });

        console.log(`[EVENT CONSUMER] Vehicle documented: ${itemId} with ${photoCount} photos (${photoCompleteness}% complete)`);
    }

    /**
     * warranty.registered → Index warranty for subrogation opportunities
     */
    private async handleWarrantyRegistered(event: EventPayload): Promise<void> {
        const warranty = event.payload as {
            id: string;
            assetId: string;
            type: string;
            status: string;
            providerName: string;
            expirationDate: string;
        };

        this.warrantyService.indexWarranty({
            id: warranty.id,
            assetId: warranty.assetId,
            type: warranty.type as any,
            status: warranty.status as any,
            providerName: warranty.providerName,
            expirationDate: warranty.expirationDate,
            claims: [],
        });

        console.log(`[EVENT CONSUMER] Warranty indexed: ${warranty.id} for asset ${warranty.assetId}`);
    }

    /**
     * warranty.claimed → Cross-reference for dual-dip fraud detection
     */
    private async handleWarrantyClaimed(event: EventPayload): Promise<void> {
        const claim = event.payload as {
            warrantyId: string;
            assetId: string;
            claimDate: string;
            issueDescription: string;
            resolution: string;
            amountPaid?: number;
        };

        this.warrantyService.recordWarrantyClaim(claim.assetId, claim.warrantyId, {
            id: `wc_${Date.now()}`,
            claimDate: claim.claimDate,
            issueDescription: claim.issueDescription,
            resolution: claim.resolution as any,
            amountPaid: claim.amountPaid,
        });

        console.log(`[EVENT CONSUMER] Warranty claim recorded for asset ${claim.assetId}`);
    }

    /**
     * Get claim evidence status for an item
     */
    public getClaimEvidence(itemId: string): { genomeVerified: boolean; scoreUpdated: boolean; fraudFlagged: boolean } | undefined {
        return this.claimEvidenceIndex.get(itemId);
    }
}

// Singleton instance
let eventConsumerInstance: EventConsumer | null = null;

export function getEventConsumer(): EventConsumer {
    if (!eventConsumerInstance) {
        eventConsumerInstance = new EventConsumer();
    }
    return eventConsumerInstance;
}
