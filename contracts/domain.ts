/**
 * TrueArk Unified Domain Model
 * 
 * This file contains the canonical definitions for core entities shared across
 * MyARK, TrueManifest, and Arkive.
 */

// --- ID Types ---
export type UUID = string; // e.g., "123e4567-e89b-12d3-a456-426614174000"
export type URN = string;  // e.g., "urn:trueark:vault:123"

// --- Enums ---

export enum EntityType {
    USER = 'USER',
    VAULT = 'VAULT',
    ASSET = 'ASSET',
    CLAIM = 'CLAIM',
    CLAIM_ITEM = 'CLAIM_ITEM',
    SALVAGE_ITEM = 'SALVAGE_ITEM',
    AUCTION_LOT = 'AUCTION_LOT'
}

export enum CurrencyCode {
    USD = 'USD',
    CAD = 'CAD',
    EUR = 'EUR'
}

export interface Money {
    amount: number;
    currency: CurrencyCode;
}

// --- Canonical Entities ---

/**
 * A user in the ecosystem (Policyholder, Adjuster, Admin).
 * Maps to Auth provider identity.
 */
export interface User {
    id: UUID;
    urn: URN;
    email: string;
    displayName: string;
    roles: string[];
    createdAt: string; // ISO 8601
}

/**
 * A secure container for Assets within MyARK.
 * Typically represents a physical location (Home, Office).
 */
export interface Vault {
    id: UUID;
    urn: URN;
    ownerId: UUID;
    name: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    assetIds: UUID[];
    estimatedTotalValue: Money;
    createdAt: string;
}

/**
 * A discrete item of value. 
 * Can exist in a Vault (Pre-Loss) or be created ad-hoc during a Claim (Post-Loss).
 */
export interface Asset {
    id: UUID;
    urn: URN;
    vaultId?: UUID; // Null if created post-loss without MyARK
    name: string;
    description: string;
    category: string;

    // Value
    purchasePrice?: Money;
    purchaseDate?: string;
    currentEstimatedValue?: Money;

    // Media
    photos: string[]; // URLs
    documents: string[]; // URLs

    // Metadata
    make?: string;
    model?: string;
    serialNumber?: string;

    // Status
    isVerified: boolean; // True if validated by MyArk logic
    metadata: Record<string, any>;
}

/**
 * A request for indemnification.
 * Manages the lifecycle of a loss event.
 */
export interface Claim {
    id: UUID;
    urn: URN;
    policyNumber: string;
    claimNumber: string; // Carrier specific ID
    policyholderId: UUID;

    lossDate: string;
    filingDate: string;
    location: string;

    status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'CLOSED';

    // Aggregates
    totalClaimedAmount: Money;
    totalApprovedAmount: Money;
}

/**
 * An instance of an Asset attached to a Claim.
 * This effectively "locks" the Asset state at the time of loss.
 */
export interface ClaimItem {
    id: UUID;
    urn: URN;
    claimId: UUID;
    assetId: UUID; // Reference to the original Asset

    // Claim-specific overrides
    conditionAtLoss: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
    claimedValue: Money;
    approvedValue?: Money;

    // Decisions
    decision: 'APPROVE' | 'DENY' | 'REPLACE' | 'REPAIR';
    decisionReason?: string;

    // Operations
    isSalvageCandidate: boolean;
}

/**
 * An item determined to have recoverable value after a loss.
 * Usually derived from a ClaimItem.
 */
export interface SalvageItem {
    id: UUID;
    urn: URN;
    claimItemId: UUID;

    originalAssetId: UUID;
    description: string;
    condition: string;

    // Logistics
    location: string;
    shippingWeight?: number;

    estimatedRecoveryValue: Money;
}

/**
 * A grouping of SalvageItems for sale on the Arkive platform.
 */
export interface AuctionLot {
    id: UUID;
    urn: URN;
    sellerId: UUID; // Usually the Carrier or Adjuster Firm

    salvageItemIds: UUID[];

    title: string;
    description: string;

    startPrice: Money;
    reservePrice?: Money;

    startTime: string;
    endTime: string;

    status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'UNSOLD';
    winningBid?: Money;
    winningBidderId?: UUID;
}
