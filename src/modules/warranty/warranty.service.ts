/**
 * @file src/modules/warranty/warranty.service.ts
 * @description Warranty Cross-Reference Service for ClaimsIQ
 * 
 * Detects:
 * - Dual-dip fraud (warranty + insurance claim for same issue)
 * - Subrogation opportunities (manufacturer defects)
 * - Warranty claim timing anomalies
 */

import { Result } from '../../shared/types';

export type WarrantyType = 'MANUFACTURER' | 'EXTENDED' | 'RETAILER' | 'CREDIT_CARD' | 'HOME_WARRANTY' | 'APPLIANCE_SERVICE';
export type WarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'CLAIMED' | 'VOIDED' | 'TRANSFERRED';
export type DualDipRiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface WarrantyRecord {
    readonly id: string;
    readonly assetId: string;
    readonly type: WarrantyType;
    readonly status: WarrantyStatus;
    readonly providerName: string;
    readonly expirationDate: string;
    readonly claims: WarrantyClaimRecord[];
}

export interface WarrantyClaimRecord {
    readonly id: string;
    readonly claimDate: string;
    readonly issueDescription: string;
    readonly resolution: 'PENDING' | 'APPROVED' | 'DENIED' | 'REPAIR_COMPLETED' | 'REPLACEMENT_ISSUED';
    readonly amountPaid?: number;
}

export interface DualDipFinding {
    readonly type: 'WARRANTY_CLAIM_OVERLAP' | 'TIMING_SUSPICIOUS' | 'AMOUNT_MISMATCH' | 'DUPLICATE_ISSUE';
    readonly description: string;
    readonly evidence: string[];
    readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DualDipDetectionResult {
    readonly claimId: string;
    readonly assetId: string;
    readonly riskLevel: DualDipRiskLevel;
    readonly findings: DualDipFinding[];
    readonly recommendation: 'PROCEED' | 'INVESTIGATE' | 'DENY' | 'REFER_SIU';
    readonly warrantyClaims: WarrantyClaimRecord[];
    readonly subrogationOpportunity?: SubrogationOpportunity;
}

export interface SubrogationOpportunity {
    readonly source: 'MANUFACTURER' | 'RETAILER' | 'WARRANTY_PROVIDER' | 'THIRD_PARTY';
    readonly targetName: string;
    readonly estimatedRecovery: number;
    readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    readonly reason: string;
}

export class WarrantyService {
    // In-memory warranty index (production: database)
    private readonly _warranties: Map<string, WarrantyRecord[]>; // assetId -> warranties

    constructor() {
        this._warranties = new Map();
    }

    /**
     * Index a warranty from HOME's warranty.registered event
     */
    public indexWarranty(warranty: WarrantyRecord): void {
        const existing = this._warranties.get(warranty.assetId) || [];
        existing.push(warranty);
        this._warranties.set(warranty.assetId, existing);
        
        console.log(`[WARRANTY] Indexed warranty ${warranty.id} for asset ${warranty.assetId}`);
    }

    /**
     * Record a warranty claim from HOME's warranty.claimed event
     */
    public recordWarrantyClaim(assetId: string, warrantyId: string, claim: WarrantyClaimRecord): void {
        const warranties = this._warranties.get(assetId);
        if (!warranties) return;

        const warranty = warranties.find(w => w.id === warrantyId);
        if (warranty) {
            (warranty.claims as WarrantyClaimRecord[]).push(claim);
            console.log(`[WARRANTY] Recorded claim ${claim.id} on warranty ${warrantyId}`);
        }
    }

    /**
     * Detect dual-dip fraud when insurance claim is filed
     * Called during ClaimsIQ claim intake
     */
    public detectDualDip(
        claimId: string,
        assetId: string,
        incidentDate: string,
        incidentDescription: string,
        claimAmount: number
    ): Result<DualDipDetectionResult> {
        const warranties = this._warranties.get(assetId) || [];
        const findings: DualDipFinding[] = [];
        const relevantWarrantyClaims: WarrantyClaimRecord[] = [];

        const incidentTime = new Date(incidentDate).getTime();
        const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

        for (const warranty of warranties) {
            for (const wClaim of warranty.claims) {
                const wClaimTime = new Date(wClaim.claimDate).getTime();
                const timeDiff = Math.abs(incidentTime - wClaimTime);

                // Check 1: Warranty claim within 90 days of insurance claim
                if (timeDiff < NINETY_DAYS_MS) {
                    relevantWarrantyClaims.push(wClaim);

                    // Check 2: Same issue description (fuzzy match)
                    if (this.issuesSimilar(incidentDescription, wClaim.issueDescription)) {
                        findings.push({
                            type: 'DUPLICATE_ISSUE',
                            description: `Warranty claim for similar issue filed ${Math.round(timeDiff / (24 * 60 * 60 * 1000))} days apart`,
                            evidence: [
                                `Insurance claim: "${incidentDescription}"`,
                                `Warranty claim: "${wClaim.issueDescription}"`,
                                `Warranty provider: ${warranty.providerName}`,
                            ],
                            severity: 'HIGH',
                        });
                    }

                    // Check 3: Warranty already paid out
                    if (wClaim.resolution === 'APPROVED' || wClaim.resolution === 'REPAIR_COMPLETED' || wClaim.resolution === 'REPLACEMENT_ISSUED') {
                        findings.push({
                            type: 'WARRANTY_CLAIM_OVERLAP',
                            description: `Warranty already resolved this issue (${wClaim.resolution})`,
                            evidence: [
                                `Warranty claim ID: ${wClaim.id}`,
                                `Resolution: ${wClaim.resolution}`,
                                `Amount paid: $${wClaim.amountPaid || 0}`,
                            ],
                            severity: 'HIGH',
                        });
                    }

                    // Check 4: Timing suspicious (warranty claim filed AFTER incident but BEFORE insurance claim)
                    if (wClaimTime > incidentTime) {
                        findings.push({
                            type: 'TIMING_SUSPICIOUS',
                            description: 'Warranty claim filed after incident date',
                            evidence: [
                                `Incident date: ${incidentDate}`,
                                `Warranty claim date: ${wClaim.claimDate}`,
                            ],
                            severity: 'MEDIUM',
                        });
                    }
                }
            }
        }

        // Calculate risk level
        const riskLevel = this.calculateRiskLevel(findings);
        const recommendation = this.getRecommendation(riskLevel);

        // Check for subrogation opportunity
        const subrogationOpportunity = this.identifySubrogation(warranties, incidentDescription, claimAmount);

        const result: DualDipDetectionResult = {
            claimId,
            assetId,
            riskLevel,
            findings,
            recommendation,
            warrantyClaims: relevantWarrantyClaims,
            subrogationOpportunity,
        };

        console.log(`[WARRANTY] Dual-dip detection for claim ${claimId}: ${riskLevel} risk, ${findings.length} findings`);

        return { success: true, data: result };
    }

    /**
     * Identify subrogation opportunities based on warranty data
     */
    private identifySubrogation(
        warranties: WarrantyRecord[],
        incidentDescription: string,
        claimAmount: number
    ): SubrogationOpportunity | undefined {
        // Look for manufacturer warranty on defect-related claims
        const defectKeywords = ['defect', 'malfunction', 'failure', 'broke', 'stopped working', 'electrical', 'fire'];
        const isDefectRelated = defectKeywords.some(kw => incidentDescription.toLowerCase().includes(kw));

        if (!isDefectRelated) return undefined;

        const manufacturerWarranty = warranties.find(w => w.type === 'MANUFACTURER' && w.status !== 'EXPIRED');
        
        if (manufacturerWarranty) {
            return {
                source: 'MANUFACTURER',
                targetName: manufacturerWarranty.providerName,
                estimatedRecovery: claimAmount * 0.7, // Conservative estimate
                confidence: 'MEDIUM',
                reason: `Product defect may be covered under manufacturer warranty. Active warranty from ${manufacturerWarranty.providerName}.`,
            };
        }

        // Check extended warranty
        const extendedWarranty = warranties.find(w => w.type === 'EXTENDED' && w.status === 'ACTIVE');
        if (extendedWarranty) {
            return {
                source: 'WARRANTY_PROVIDER',
                targetName: extendedWarranty.providerName,
                estimatedRecovery: claimAmount * 0.5,
                confidence: 'LOW',
                reason: `Extended warranty may cover this loss. Contact ${extendedWarranty.providerName} for coordination.`,
            };
        }

        return undefined;
    }

    /**
     * Fuzzy match issue descriptions
     */
    private issuesSimilar(desc1: string, desc2: string): boolean {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
        const words1 = new Set(normalize(desc1));
        const words2 = new Set(normalize(desc2));
        
        let matches = 0;
        for (const word of words1) {
            if (words2.has(word)) matches++;
        }
        
        const similarity = matches / Math.max(words1.size, words2.size);
        return similarity > 0.3; // 30% word overlap threshold
    }

    /**
     * Calculate overall risk level from findings
     */
    private calculateRiskLevel(findings: DualDipFinding[]): DualDipRiskLevel {
        if (findings.length === 0) return 'NONE';

        const highCount = findings.filter(f => f.severity === 'HIGH').length;
        const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;

        if (highCount >= 2) return 'CRITICAL';
        if (highCount >= 1) return 'HIGH';
        if (mediumCount >= 2) return 'MEDIUM';
        if (mediumCount >= 1 || findings.length > 0) return 'LOW';

        return 'NONE';
    }

    /**
     * Get recommendation based on risk level
     */
    private getRecommendation(riskLevel: DualDipRiskLevel): 'PROCEED' | 'INVESTIGATE' | 'DENY' | 'REFER_SIU' {
        switch (riskLevel) {
            case 'CRITICAL': return 'REFER_SIU';
            case 'HIGH': return 'DENY';
            case 'MEDIUM': return 'INVESTIGATE';
            case 'LOW': return 'INVESTIGATE';
            default: return 'PROCEED';
        }
    }

    /**
     * Get all warranties for an asset
     */
    public getWarranties(assetId: string): WarrantyRecord[] {
        return this._warranties.get(assetId) || [];
    }
}
