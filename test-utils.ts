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
        status: ClaimStatus.NEW_FROM_MYARK,
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
