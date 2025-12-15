/**
 * @file src/modules/provenance/provenance.service.ts
 * @description Pre-Loss Provenance Service
 * 
 * Provides pre-loss documentation data for claims processing.
 * Integrates with HOME inventory data via event consumption.
 */

import { Result } from '../../shared/types';

export interface PreLossProvenance {
    readonly itemId: string;
    readonly provenanceScore: number;
    readonly documentedValue: number;
    readonly evidencePackage: {
        readonly photos: number;
        readonly receipts: number;
        readonly genomeVerified: boolean;
        readonly lastConditionScore: number;
        readonly warranties: number;
    };
    readonly claimReadiness: 'HIGH' | 'MEDIUM' | 'LOW';
    readonly ownershipHistory: number;
    readonly lastVerified: string;
    readonly fraudFlags: string[];
}

export interface ItemProvenanceRecord {
    readonly itemId: string;
    readonly walletId: string;
    readonly provenanceScore: number;
    readonly documentedValue: number;
    readonly photoCount: number;
    readonly receiptCount: number;
    readonly warrantyCount: number;
    readonly genomeVerified: boolean;
    readonly conditionScore: number;
    readonly ownershipTransfers: number;
    readonly lastVerifiedAt: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export class ProvenanceService {
    // In-memory provenance index (production: database populated by HOME events)
    private readonly _items: Map<string, ItemProvenanceRecord>;

    constructor() {
        this._items = new Map();
    }

    /**
     * Index item provenance from HOME's identity.created event
     */
    public indexItem(record: ItemProvenanceRecord): void {
        this._items.set(record.itemId, record);
        console.log(`[PROVENANCE] Indexed item ${record.itemId} | Score: ${record.provenanceScore}`);
    }

    /**
     * Update provenance from HOME events (score.updated, genome.verified, etc.)
     */
    public updateItem(itemId: string, updates: Partial<ItemProvenanceRecord>): void {
        const existing = this._items.get(itemId);
        if (existing) {
            this._items.set(itemId, { ...existing, ...updates, updatedAt: new Date().toISOString() });
            console.log(`[PROVENANCE] Updated item ${itemId}`);
        }
    }

    /**
     * GET /v1/claimsiq/items/{itemId}/preloss-provenance
     * Returns pre-loss provenance data for claims processing
     * NOW DELEGATED TO PROVENIQ CORE
     */
    public async getPreLossProvenance(itemId: string): Promise<Result<PreLossProvenance>> {
        const record = this._items.get(itemId);

        if (!record) {
            // In production, would query HOME API or database
            return this.getMockProvenance(itemId);
        }

        try {
            // CALL CORE BRAIN
            // Vite uses import.meta.env for environment variables (prefixed with VITE_)
            const CORE_URL = import.meta.env.VITE_PROVENIQ_CORE_URL || 'http://localhost:3000';
            const coreResponse = await fetch(`${CORE_URL}/api/v1/provenance/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoCount: record.photoCount,
                    receiptCount: record.receiptCount,
                    warrantyCount: record.warrantyCount,
                    genomeVerified: record.genomeVerified,
                    ownershipTransfers: record.ownershipTransfers,
                    lastVerifiedAt: record.lastVerifiedAt,
                    documentedValue: record.documentedValue
                })
            });

            if (!coreResponse.ok) {
                console.error(`[PROVENANCE] Core API error: ${coreResponse.statusText}`);
                // Fallback to local calculation if Core is down (Circuit Breaker)
                return this.calculateLocal(record);
            }

            const coreResult = await coreResponse.json();
            const { data } = coreResult; // Assuming standard response wrapper

            const provenance: PreLossProvenance = {
                itemId: record.itemId,
                provenanceScore: data.score,
                documentedValue: record.documentedValue,
                evidencePackage: {
                    photos: record.photoCount,
                    receipts: record.receiptCount,
                    genomeVerified: record.genomeVerified,
                    lastConditionScore: record.conditionScore,
                    warranties: record.warrantyCount,
                },
                claimReadiness: data.claimReadiness,
                ownershipHistory: record.ownershipTransfers,
                lastVerified: record.lastVerifiedAt,
                fraudFlags: data.fraudFlags,
            };

            return { success: true, data: provenance };

        } catch (error) {
            console.error('[PROVENANCE] Failed to contact Core:', error);
            return this.calculateLocal(record);
        }
    }

    /**
     * Fallback local calculation (Redundant safety net)
     */
    private calculateLocal(record: ItemProvenanceRecord): Result<PreLossProvenance> {
        // ... (Legacy logic preserved for fallback)
        const claimReadiness = this.calculateClaimReadiness(record);
        const fraudFlags = this.detectFraudFlags(record);

        return {
            success: true,
            data: {
                itemId: record.itemId,
                provenanceScore: record.provenanceScore, // Use stored score
                documentedValue: record.documentedValue,
                evidencePackage: {
                    photos: record.photoCount,
                    receipts: record.receiptCount,
                    genomeVerified: record.genomeVerified,
                    lastConditionScore: record.conditionScore,
                    warranties: record.warrantyCount,
                },
                claimReadiness,
                ownershipHistory: record.ownershipTransfers,
                lastVerified: record.lastVerifiedAt,
                fraudFlags,
            }
        };
    }

    /**
     * Calculate claim readiness based on documentation completeness
     */
    private calculateClaimReadiness(record: ItemProvenanceRecord): 'HIGH' | 'MEDIUM' | 'LOW' {
        let score = 0;

        if (record.photoCount >= 4) score += 30;
        else if (record.photoCount >= 2) score += 15;

        if (record.receiptCount >= 1) score += 25;

        if (record.genomeVerified) score += 25;

        if (record.provenanceScore >= 80) score += 20;
        else if (record.provenanceScore >= 60) score += 10;

        if (score >= 80) return 'HIGH';
        if (score >= 50) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Detect potential fraud flags from provenance data
     */
    private detectFraudFlags(record: ItemProvenanceRecord): string[] {
        const flags: string[] = [];

        // Recent ownership transfer
        const lastVerified = new Date(record.lastVerifiedAt);
        const daysSinceVerification = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceVerification > 365) {
            flags.push('STALE_VERIFICATION');
        }

        if (record.ownershipTransfers > 3) {
            flags.push('HIGH_OWNERSHIP_VOLATILITY');
        }

        if (record.provenanceScore < 50) {
            flags.push('LOW_PROVENANCE_SCORE');
        }

        if (!record.genomeVerified && record.documentedValue > 5000) {
            flags.push('HIGH_VALUE_UNVERIFIED');
        }

        return flags;
    }

    /**
     * Mock provenance for items not in index (demo purposes)
     */
    private getMockProvenance(itemId: string): Result<PreLossProvenance> {
        // Simulate different scenarios based on itemId prefix
        if (itemId.startsWith('item_unverified_')) {
            return {
                success: true,
                data: {
                    itemId,
                    provenanceScore: 35,
                    documentedValue: 1500,
                    evidencePackage: {
                        photos: 1,
                        receipts: 0,
                        genomeVerified: false,
                        lastConditionScore: 0,
                        warranties: 0,
                    },
                    claimReadiness: 'LOW',
                    ownershipHistory: 0,
                    lastVerified: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
                    fraudFlags: ['LOW_PROVENANCE_SCORE', 'STALE_VERIFICATION'],
                },
            };
        }

        // Default: well-documented item
        return {
            success: true,
            data: {
                itemId,
                provenanceScore: 87,
                documentedValue: 12000,
                evidencePackage: {
                    photos: 12,
                    receipts: 2,
                    genomeVerified: true,
                    lastConditionScore: 92,
                    warranties: 1,
                },
                claimReadiness: 'HIGH',
                ownershipHistory: 2,
                lastVerified: new Date().toISOString(),
                fraudFlags: [],
            },
        };
    }
}
