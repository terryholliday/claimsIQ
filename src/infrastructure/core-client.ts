/**
 * @file src/infrastructure/core-client.ts
 * @description PROVENIQ Core Client for ClaimsIQ
 * 
 * Integrates with Core for:
 * - Fraud scoring (claim risk assessment)
 * - Asset registry (PAID lookup, valuation)
 */

const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || 'http://localhost:8000';

export interface FraudScoreRequest {
    entityType: 'claim' | 'asset' | 'claimant';
    entityId: string;
    userId?: string;
    assetId?: string;
    amountMicros?: string;
    eventType: string;
    userClaimCount30d?: number;
    userClaimTotalMicros30d?: string;
    assetClaimCountAll?: number;
    evidenceCount?: number;
    hasAnchorVerification?: boolean;
    hasLedgerHistory?: boolean;
}

export interface FraudScoreResult {
    scoreId: string;
    entityType: string;
    entityId: string;
    score: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    signals: Array<{
        signalType: string;
        severity: number;
        description: string;
    }>;
    recommendation: 'approve' | 'review' | 'escalate' | 'deny';
    autoDecisionAllowed: boolean;
}

export interface ValuationResult {
    valuationId: string;
    assetId: string;
    estimatedValueMicros: string;
    lowEstimateMicros: string;
    highEstimateMicros: string;
    confidenceScore: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    method: string;
    biasFlags: string[];
}

export interface RegisteredAsset {
    paid: string;
    sourceApp: string;
    sourceAssetId: string;
    assetType: string;
    category: string;
    name: string;
    ownerId?: string;
    currentValueMicros?: string;
    anchorId?: string;
}

export interface ProvenanceCertificate {
    assetId: string;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    strengths: string[];
    weaknesses: string[];
    ledgerEventCount: number;
    chainIntegrity: boolean;
    certificateId: string;
    issuedAt: string;
    validUntil: string;
}

class CoreClient {
    /**
     * Score claim for fraud risk
     */
    async getFraudScore(request: FraudScoreRequest): Promise<FraudScoreResult | null> {
        try {
            const response = await fetch(`${CORE_SERVICE_URL}/api/v1/fraud/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity_type: request.entityType,
                    entity_id: request.entityId,
                    user_id: request.userId,
                    asset_id: request.assetId,
                    amount_micros: request.amountMicros,
                    source_app: 'claimsiq',
                    event_type: request.eventType,
                    user_claim_count_30d: request.userClaimCount30d || 0,
                    user_claim_total_micros_30d: request.userClaimTotalMicros30d || "0",
                    asset_claim_count_all: request.assetClaimCountAll || 0,
                    evidence_count: request.evidenceCount || 0,
                    has_anchor_verification: request.hasAnchorVerification || false,
                    has_ledger_history: request.hasLedgerHistory || false,
                })
            });

            if (!response.ok) {
                console.warn(`[CORE] Fraud score request failed: ${response.status}`);
                return null;
            }

            const data = await response.json() as any;
            return {
                scoreId: data.score_id,
                entityType: data.entity_type,
                entityId: data.entity_id,
                score: data.score,
                riskLevel: data.risk_level,
                signals: (data.signals || []).map((s: any) => ({
                    signalType: s.signal_type,
                    severity: s.severity,
                    description: s.description,
                })),
                recommendation: data.recommendation,
                autoDecisionAllowed: data.auto_decision_allowed,
            };
        } catch (error) {
            console.error('[CORE] Fraud score error', error);
            return null;
        }
    }

    /**
     * Get valuation for an asset
     */
    async getValuation(assetId: string, itemType: string, condition: string): Promise<ValuationResult | null> {
        try {
            const response = await fetch(`${CORE_SERVICE_URL}/api/v1/valuations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset_id: assetId,
                    item_type: itemType,
                    condition: condition,
                    source_app: 'claimsiq',
                })
            });

            if (!response.ok) {
                console.warn(`[CORE] Valuation request failed: ${response.status}`);
                return null;
            }

            const data = await response.json() as any;
            return {
                valuationId: data.valuation_id,
                assetId: data.asset_id,
                estimatedValueMicros: data.estimated_value_micros,
                lowEstimateMicros: data.low_estimate_micros,
                highEstimateMicros: data.high_estimate_micros,
                confidenceScore: data.confidence_score,
                confidenceLevel: data.confidence_level,
                method: data.method,
                biasFlags: data.bias_flags || [],
            };
        } catch (error) {
            console.error('[CORE] Valuation error', error);
            return null;
        }
    }

    /**
     * Get asset by PROVENIQ Asset ID (PAID)
     */
    async getAsset(paid: string): Promise<RegisteredAsset | null> {
        try {
            const response = await fetch(`${CORE_SERVICE_URL}/api/v1/registry/${paid}`);

            if (!response.ok) {
                if (response.status === 404) return null;
                console.warn(`[CORE] Asset lookup failed: ${response.status}`);
                return null;
            }

            const data = await response.json() as any;
            return {
                paid: data.paid,
                sourceApp: data.source_app,
                sourceAssetId: data.source_asset_id,
                assetType: data.asset_type,
                category: data.category,
                name: data.name,
                ownerId: data.owner_id,
                currentValueMicros: data.current_value_micros,
                anchorId: data.anchor_id,
            };
        } catch (error) {
            console.error('[CORE] Asset lookup error', error);
            return null;
        }
    }

    /**
     * Get pre-loss provenance certificate for an asset
     */
    async getProvenanceCertificate(assetId: string, ledgerEventCount: number = 0): Promise<ProvenanceCertificate | null> {
        try {
            const response = await fetch(`${CORE_SERVICE_URL}/api/v1/provenance/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetId,
                    hasReceipt: true,
                    imageCount: 3,
                    ledgerEventCount,
                    sourceApp: 'claimsiq',
                })
            });

            if (!response.ok) {
                console.warn(`[CORE] Provenance request failed: ${response.status}`);
                return this.generateLocalCertificate(assetId, ledgerEventCount);
            }

            const data = await response.json() as any;
            return {
                assetId: data.assetId,
                score: data.score,
                grade: data.grade,
                confidence: data.confidence,
                strengths: data.strengths || [],
                weaknesses: data.weaknesses || [],
                ledgerEventCount,
                chainIntegrity: true,
                certificateId: `CERT-${assetId}-${Date.now().toString(36)}`,
                issuedAt: new Date().toISOString(),
                validUntil: data.validUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            };
        } catch (error) {
            console.error('[CORE] Provenance error', error);
            return this.generateLocalCertificate(assetId, ledgerEventCount);
        }
    }

    /**
     * Generate local fallback certificate when Core unavailable
     */
    private generateLocalCertificate(assetId: string, ledgerEventCount: number): ProvenanceCertificate {
        const score = Math.min(30 + ledgerEventCount * 10, 70);
        const grade = score >= 70 ? 'C' : score >= 50 ? 'D' : 'F';
        
        return {
            assetId,
            score,
            grade,
            confidence: 'LOW',
            strengths: ledgerEventCount > 0 ? [`${ledgerEventCount} ledger events`] : [],
            weaknesses: ['Core unavailable - limited verification'],
            ledgerEventCount,
            chainIntegrity: true,
            certificateId: `CERT-LOCAL-${assetId}-${Date.now().toString(36)}`,
            issuedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
    }

    /**
     * Compare Core valuation vs claimed value (dispute resolution)
     */
    async getValuationDispute(
        assetId: string,
        claimedValue: number,
        itemType: string,
        condition: string
    ): Promise<{ coreValue: number; claimedValue: number; variance: number; recommendation: string } | null> {
        const valuation = await this.getValuation(assetId, itemType, condition);
        
        if (!valuation) {
            return null;
        }

        const coreValue = parseInt(valuation.estimatedValueMicros) / 1_000_000;
        const variance = ((claimedValue - coreValue) / coreValue) * 100;

        let recommendation: string;
        if (variance <= 10) {
            recommendation = 'ACCEPT_CLAIMED';
        } else if (variance <= 30) {
            recommendation = 'NEGOTIATE';
        } else if (variance <= 50) {
            recommendation = 'USE_CORE_VALUE';
        } else {
            recommendation = 'ESCALATE_FRAUD';
        }

        return {
            coreValue,
            claimedValue,
            variance: Math.round(variance * 100) / 100,
            recommendation,
        };
    }
}

// Singleton
let coreClientInstance: CoreClient | null = null;

export function getCoreClient(): CoreClient {
    if (!coreClientInstance) {
        coreClientInstance = new CoreClient();
    }
    return coreClientInstance;
}
