/**
 * @file src/modules/salvage/salvage.types.ts
 * @description Salvage Module Types - ClaimsIQ → Bids Integration
 */

export type SalvageStatus = 'DRAFT' | 'PENDING_PICKUP' | 'IN_TRANSIT' | 'LISTED' | 'SOLD' | 'CANCELLED';
export type SalvageType = 'AUCTION' | 'DIRECT_SALE' | 'SCRAP' | 'DONATE';
export type AuctionType = 'TIMED' | 'LIVE' | 'BUY_NOW';

export interface SalvageAsset {
    readonly assetId: string;
    readonly name: string;
    readonly category: string;
    readonly claimedValue: number;
    readonly estimatedRecovery: number;
    readonly condition: 'DAMAGED' | 'REPAIRABLE' | 'FUNCTIONAL';
    readonly imageUrls: string[];
}

export interface SalvageManifest {
    readonly id: string;
    readonly claimId: string;
    readonly insurerWalletId: string;
    readonly assets: SalvageAsset[];
    readonly salvageType: SalvageType;
    readonly pickupLocation: string;
    readonly totalEstimatedRecovery: number;
    readonly actualRecovery?: number; // Actual amount recovered from Bids auctions
    readonly status: SalvageStatus;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly ledgerEventIds: string[]; // Proveniq Ledger event references
}

export interface CreateSalvageRequest {
    readonly assets: string[]; // Asset IDs
    readonly salvageType: SalvageType;
    readonly pickupLocation: string;
    readonly estimatedRecovery: number;
}

export interface ListOnBidsRequest {
    readonly auctionType: AuctionType;
    readonly duration: number; // Days
    readonly reservePrice: number;
    readonly buyNowPrice?: number;
}

export interface ListOnBidsResponse {
    readonly manifestId: string;
    readonly bidsListingIds: string[];
    readonly status: SalvageStatus;
    readonly auctionStartTime: string;
    readonly auctionEndTime: string;
}

export interface BidsListingPayload {
    readonly itemId: string;
    readonly title: string;
    readonly description: string;
    readonly category: string;
    readonly startingPrice: number;
    readonly reservePrice: number;
    readonly buyNowPrice?: number;
    readonly auctionType: AuctionType;
    readonly duration: number;
    readonly images: string[];
    readonly provenanceData: {
        readonly claimId: string;
        readonly originalValue: number;
        readonly salvageReason: string;
    };
    readonly sourceApp: 'CLAIMSIQ';
    readonly correlationId: string;
}
