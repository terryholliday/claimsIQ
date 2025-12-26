/**
 * @file src/modules/guidewire/guidewire.types.ts
 * @description Guidewire Integration Types
 * 
 * NOTE: Guidewire integration requires partnership licensing ($50K-150K).
 * This module provides the structure for future integration.
 * 
 * Guidewire Products:
 * - ClaimCenter: Claims management
 * - PolicyCenter: Policy administration
 * - BillingCenter: Billing operations
 */

export type GuidewireEnvironment = 'sandbox' | 'staging' | 'production';

export interface GuidewireConfig {
    readonly environment: GuidewireEnvironment;
    readonly baseUrl: string;
    readonly clientId: string;
    readonly clientSecret: string;
    readonly tenantId: string;
    readonly apiVersion: string;
}

export interface GuidewireClaimPayload {
    readonly claimNumber: string;
    readonly lossDate: string;
    readonly reportedDate: string;
    readonly claimantName: string;
    readonly policyNumber: string;
    readonly lossType: GuidewireLossType;
    readonly lossDescription: string;
    readonly lossLocation: {
        readonly address: string;
        readonly city: string;
        readonly state: string;
        readonly postalCode: string;
    };
    readonly estimatedLoss: number;
    readonly deductible: number;
}

export type GuidewireLossType = 
    | 'PROPERTY_DAMAGE'
    | 'THEFT'
    | 'FIRE'
    | 'WATER_DAMAGE'
    | 'WIND_DAMAGE'
    | 'LIABILITY'
    | 'AUTO_COLLISION'
    | 'AUTO_COMPREHENSIVE'
    | 'OTHER';

export interface GuidewireClaimResponse {
    readonly claimId: string;
    readonly claimNumber: string;
    readonly status: GuidewireClaimStatus;
    readonly assignedAdjuster?: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export type GuidewireClaimStatus =
    | 'DRAFT'
    | 'OPEN'
    | 'IN_REVIEW'
    | 'PENDING_INFO'
    | 'APPROVED'
    | 'DENIED'
    | 'CLOSED';

export interface GuidewireExposure {
    readonly exposureId: string;
    readonly claimId: string;
    readonly exposureType: string;
    readonly description: string;
    readonly reserveAmount: number;
    readonly paidAmount: number;
    readonly status: 'OPEN' | 'CLOSED';
}

export interface GuidewireActivity {
    readonly activityId: string;
    readonly claimId: string;
    readonly activityType: string;
    readonly subject: string;
    readonly priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    readonly dueDate: string;
    readonly assignedTo: string;
    readonly status: 'OPEN' | 'COMPLETE' | 'CANCELED';
}

export interface GuidewireDocument {
    readonly documentId: string;
    readonly claimId: string;
    readonly name: string;
    readonly mimeType: string;
    readonly size: number;
    readonly uploadedAt: string;
    readonly uploadedBy: string;
}

export interface GuidewireSyncResult {
    readonly success: boolean;
    readonly guidewireClaimId?: string;
    readonly syncedAt: string;
    readonly errors?: string[];
}

export interface ClaimsIQToGuidewireMapping {
    readonly claimsiqClaimId: string;
    readonly guidewireClaimId: string;
    readonly syncDirection: 'PUSH' | 'PULL' | 'BIDIRECTIONAL';
    readonly lastSyncAt: string;
    readonly syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
}
