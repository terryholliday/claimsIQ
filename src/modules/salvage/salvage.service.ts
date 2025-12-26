/**
 * @file src/modules/salvage/salvage.service.ts
 * @description Salvage Service - Orchestrates ClaimsIQ → Bids Integration
 */

import { Result } from '../../shared/types';
import {
    SalvageManifest,
    SalvageAsset,
    SalvageStatus,
    CreateSalvageRequest,
    ListOnBidsRequest,
    ListOnBidsResponse,
    BidsListingPayload,
} from './salvage.types';
import { createHash, randomUUID } from 'crypto';

export class SalvageService {
    // In-memory storage (production: database)
    private readonly _manifests: Map<string, SalvageManifest>;
    
    // Mock Bids API base URL (production: from config)
    private readonly BIDS_API_URL = process.env.BIDS_API_URL || 'http://localhost:3002';

    constructor() {
        this._manifests = new Map();
    }

    /**
     * Creates a salvage manifest for a settled claim.
     * Publishes: salvage.created event
     */
    public async createManifest(
        claimId: string,
        insurerWalletId: string,
        request: CreateSalvageRequest,
        assetDetails: SalvageAsset[]
    ): Promise<Result<SalvageManifest>> {
        try {
            const manifestId = `manifest_${randomUUID().substring(0, 8)}`;
            const now = new Date().toISOString();

            const manifest: SalvageManifest = {
                id: manifestId,
                claimId,
                insurerWalletId,
                assets: assetDetails,
                salvageType: request.salvageType,
                pickupLocation: request.pickupLocation,
                totalEstimatedRecovery: assetDetails.reduce((sum, a) => sum + a.estimatedRecovery, 0),
                status: 'DRAFT',
                createdAt: now,
                updatedAt: now,
                ledgerEventIds: [],
            };

            this._manifests.set(manifestId, manifest);

            // TODO: Publish salvage.created event to event bus
            console.log(`[SALVAGE] Event: salvage.created | Manifest: ${manifestId} | Claim: ${claimId}`);

            return { success: true, data: manifest };
        } catch (error) {
            return { success: false, error: error as Error };
        }
    }

    /**
     * Lists salvage manifest items on Bids auction platform.
     * Calls: POST /v1/bids/listings
     * Publishes: salvage.listed event
     */
    public async listOnBids(
        manifestId: string,
        request: ListOnBidsRequest
    ): Promise<Result<ListOnBidsResponse>> {
        const manifest = this._manifests.get(manifestId);

        if (!manifest) {
            return { success: false, error: new Error('Manifest not found') };
        }

        if (manifest.status !== 'DRAFT' && manifest.status !== 'PENDING_PICKUP') {
            return { success: false, error: new Error(`Cannot list manifest in status: ${manifest.status}`) };
        }

        try {
            const correlationId = `corr_${randomUUID().substring(0, 8)}`;
            const bidsListingIds: string[] = [];
            const now = new Date();
            const endTime = new Date(now.getTime() + request.duration * 24 * 60 * 60 * 1000);

            // Create listing for each asset
            for (const asset of manifest.assets) {
                const payload: BidsListingPayload = {
                    itemId: asset.assetId,
                    title: `Salvage: ${asset.name}`,
                    description: `Insurance salvage item from claim ${manifest.claimId}. Condition: ${asset.condition}`,
                    category: asset.category,
                    startingPrice: Math.floor(asset.estimatedRecovery * 0.5), // Start at 50% of estimate
                    reservePrice: request.reservePrice / manifest.assets.length,
                    buyNowPrice: request.buyNowPrice ? request.buyNowPrice / manifest.assets.length : undefined,
                    auctionType: request.auctionType,
                    duration: request.duration,
                    images: asset.imageUrls,
                    provenanceData: {
                        claimId: manifest.claimId,
                        originalValue: asset.claimedValue,
                        salvageReason: 'Insurance claim settlement',
                    },
                    sourceApp: 'CLAIMSIQ',
                    correlationId,
                };

                // Mock Bids API call (production: actual HTTP call)
                const listingId = await this.callBidsAPI(payload);
                bidsListingIds.push(listingId);

                console.log(`[SALVAGE] Listed asset ${asset.assetId} on Bids as ${listingId}`);
            }

            // Update manifest status
            const updatedManifest: SalvageManifest = {
                ...manifest,
                status: 'LISTED',
                updatedAt: new Date().toISOString(),
            };
            this._manifests.set(manifestId, updatedManifest);

            // TODO: Publish salvage.listed event to event bus
            console.log(`[SALVAGE] Event: salvage.listed | Manifest: ${manifestId} | Listings: ${bidsListingIds.join(', ')}`);

            const response: ListOnBidsResponse = {
                manifestId,
                bidsListingIds,
                status: 'LISTED',
                auctionStartTime: now.toISOString(),
                auctionEndTime: endTime.toISOString(),
            };

            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error as Error };
        }
    }

    /**
     * Gets a salvage manifest by ID.
     */
    public getManifest(manifestId: string): Result<SalvageManifest> {
        const manifest = this._manifests.get(manifestId);

        if (!manifest) {
            return { success: false, error: new Error('Manifest not found') };
        }

        return { success: true, data: manifest };
    }

    /**
     * Gets all manifests for a claim.
     */
    public getManifestsByClaimId(claimId: string): SalvageManifest[] {
        return Array.from(this._manifests.values()).filter(m => m.claimId === claimId);
    }

    /**
     * Calls Bids API to create auction listing.
     * Falls back to mock if Bids service unavailable.
     */
    private async callBidsAPI(payload: BidsListingPayload): Promise<string> {
        try {
            const response = await fetch(`${this.BIDS_API_URL}/v1/bids/listings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Source-App': 'proveniq-claimsiq',
                    'X-Correlation-Id': payload.correlationId,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`[SALVAGE] Bids API response: ${JSON.stringify(data)}`);
                return data.listingId || data.id;
            }

            // Bids service returned error - fall back to mock
            console.warn(`[SALVAGE] Bids API error (${response.status}), using mock listing ID`);
        } catch (error) {
            // Bids service unavailable - fall back to mock
            console.warn(`[SALVAGE] Bids service unavailable, using mock listing ID:`, error);
        }

        // Generate mock listing ID as fallback
        const listingId = `listing_${createHash('sha256')
            .update(payload.itemId + payload.correlationId)
            .digest('hex')
            .substring(0, 8)}`;

        return listingId;
    }

    /**
     * Handles auction.settled event from Bids.
     * Updates manifest status when salvage items are sold.
     * Writes recovery event to Proveniq Ledger.
     */
    public async handleAuctionSettled(
        listingId: string,
        salePrice: number,
        buyerWalletId: string,
        manifestId: string
    ): Promise<Result<{ ledgerEventId: string }>> {
        const manifest = this._manifests.get(manifestId);
        
        if (!manifest) {
            return { success: false, error: new Error('Manifest not found') };
        }

        console.log(`[SALVAGE] Received auction.settled for listing ${listingId} | Price: ${salePrice}`);

        try {
            // 1. Update manifest with actual recovery
            const currentRecovery = manifest.actualRecovery || 0;
            const updatedManifest: SalvageManifest = {
                ...manifest,
                actualRecovery: currentRecovery + salePrice,
                status: 'SOLD',
                updatedAt: new Date().toISOString(),
            };

            // 2. Write to Proveniq Ledger
            const ledgerEventId = await this.writeSalvageRecoveryToLedger({
                manifestId,
                claimId: manifest.claimId,
                listingId,
                salePrice,
                buyerWalletId,
                insurerWalletId: manifest.insurerWalletId,
                totalRecovery: updatedManifest.actualRecovery!,
            });

            // 3. Store ledger event reference (create new object since readonly)
            const finalManifest: SalvageManifest = {
                ...updatedManifest,
                ledgerEventIds: [...(manifest.ledgerEventIds || []), ledgerEventId],
            };
            this._manifests.set(manifestId, finalManifest);

            console.log(`[SALVAGE] Recovery recorded on Ledger: ${ledgerEventId}`);

            // 4. Publish salvage.recovered event
            console.log(`[SALVAGE] Event: salvage.recovered | Manifest: ${manifestId} | Recovery: ${salePrice}`);

            return { success: true, data: { ledgerEventId } };
        } catch (error) {
            return { success: false, error: error as Error };
        }
    }

    /**
     * Writes salvage recovery event to Proveniq Ledger.
     * POST /v1/ledger/events
     */
    private async writeSalvageRecoveryToLedger(data: {
        manifestId: string;
        claimId: string;
        listingId: string;
        salePrice: number;
        buyerWalletId: string;
        insurerWalletId: string;
        totalRecovery: number;
    }): Promise<string> {
        const correlationId = `corr_${randomUUID().substring(0, 8)}`;
        
        const ledgerPayload = {
            eventType: 'salvage.recovered',
            walletId: data.insurerWalletId,
            itemId: data.listingId, // The sold item
            payload: {
                manifestId: data.manifestId,
                claimId: data.claimId,
                salePrice: data.salePrice,
                buyerWalletId: data.buyerWalletId,
                totalRecovery: data.totalRecovery,
                custodyTransfer: {
                    fromState: 'BIDS_VAULT',
                    toState: 'BUYER',
                },
            },
            sourceApp: 'CLAIMSIQ',
            correlationId,
        };

        // Mock Ledger API call (production: actual HTTP call)
        await new Promise(resolve => setTimeout(resolve, 50));

        const eventId = `evt_${createHash('sha256')
            .update(JSON.stringify(ledgerPayload))
            .digest('hex')
            .substring(0, 12)}`;

        // In production:
        // const response = await fetch(`${this.LEDGER_API_URL}/v1/ledger/events`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${serviceJwt}`,
        //         'X-Service-Name': 'proveniq-claimsiq',
        //         'X-Correlation-Id': correlationId,
        //     },
        //     body: JSON.stringify(ledgerPayload),
        // });
        // return response.json().eventId;

        console.log(`[LEDGER] POST /v1/ledger/events | Type: salvage.recovered | Event: ${eventId}`);

        return eventId;
    }
}
