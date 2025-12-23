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

class CoreClient {
    /**
     * Score claim for fraud risk
     */
    async getFraudScore(request: FraudScoreRequest): Promise<FraudScoreResult | null> {
        try {
            const response = await fetch(`${CORE_SERVICE_URL}/v1/fraud/score`, {
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
            const response = await fetch(`${CORE_SERVICE_URL}/v1/valuations`, {
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
            const response = await fetch(`${CORE_SERVICE_URL}/v1/assets/${paid}`);

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
}

// Singleton
let coreClientInstance: CoreClient | null = null;

export function getCoreClient(): CoreClient {
    if (!coreClientInstance) {
        coreClientInstance = new CoreClient();
    }
    return coreClientInstance;
}
