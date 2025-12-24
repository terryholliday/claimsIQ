import { Claim, ClaimStatus, AssetStatus, FraudRiskLevel } from './types';

export const createMockClaim = (overrides?: Partial<Claim>): Claim => {
    return {
        id: 'test-claim-id',
        policyholderName: 'Test Policyholder',
        policyNumber: 'POL-00000',
        policyStartDate: '2023-01-01',
        coverageLimit: 100000,
        deductible: 500,
        claimDate: '2023-06-01',
        location: 'Test City, ST',
        status: ClaimStatus.NEW_FROM_HOME,
        totalClaimedValue: 0,
        touchTime: 0,
        auditTrail: [],
        assets: [],
        ...overrides,
    };
};

export const createMockAsset = (overrides?: Partial<any>) => ({
    id: 'asset-1',
    name: 'Test Asset',
    category: 'Electronics',
    claimedValue: 100,
    purchaseDate: '2023-01-01',
    status: AssetStatus.UNVERIFIED,
    imageUrl: '',
    origin: 'POST_LOSS',
    ...overrides
});

// --- New Domain Mocks ---
import { Vault, SalvageItem, AuctionLot, EntityType, CurrencyCode } from './contracts/domain';

export const createMockVault = (overrides?: Partial<Vault>): Vault => ({
    id: 'vault-1',
    urn: 'urn:proveniq:home:vault:vault-1',
    ownerId: 'user-1',
    name: 'Main Vault',
    assetIds: [],
    estimatedTotalValue: { amount: 0, currency: CurrencyCode.USD },
    createdAt: new Date().toISOString(),
    ...overrides
});

export const createMockSalvageItem = (overrides?: Partial<SalvageItem>): SalvageItem => ({
    id: 'salvage-1',
    urn: 'urn:proveniq:bids:salvage:salvage-1',
    claimItemId: 'claim-item-1',
    originalAssetId: 'asset-1',
    description: 'Damaged 4K TV',
    condition: 'Damaged screen, power functional',
    location: 'Warehouse A',
    estimatedRecoveryValue: { amount: 50, currency: CurrencyCode.USD },
    ...overrides
});

export const createMockAuctionLot = (overrides?: Partial<AuctionLot>): AuctionLot => ({
    id: 'lot-1',
    urn: 'urn:proveniq:bids:lot:lot-1',
    sellerId: 'carrier-1',
    salvageItemIds: ['salvage-1'],
    title: 'Lot of Electronics',
    description: 'Various damaged electronics',
    startPrice: { amount: 10, currency: CurrencyCode.USD },
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 86400000).toISOString(), // +1 day
    status: 'DRAFT',
    ...overrides
});
