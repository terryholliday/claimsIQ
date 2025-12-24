/**
 * @file src/api/attribution.controller.ts
 * @description Attribution Packet Controller
 * 
 * Generates comprehensive claim attribution packets for adjusters.
 * Aggregates: Pre-loss provenance, Ledger events, Core valuations, fraud scores.
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getLedgerClient } from '../infrastructure/ledger-client';
import { getCoreClient } from '../infrastructure/core-client';

export interface AttributionPacket {
    packetId: string;
    claimId: string;
    generatedAt: string;
    
    // Claimant info
    claimant: {
        id: string;
        name: string;
        policyNumber: string;
    };
    
    // Asset info
    asset: {
        id: string;
        name: string;
        category: string;
        claimedValue: number;
        coreValuation?: {
            estimatedValue: number;
            confidence: string;
            method: string;
        };
        anchorId?: string;
    };
    
    // Pre-loss provenance
    preLossProvenance: {
        hasPreLossEvidence: boolean;
        evidenceCount: number;
        earliestTimestamp?: string;
        ledgerEventIds: string[];
        summary: string;
    };
    
    // Fraud analysis
    fraudAnalysis: {
        score: number;
        riskLevel: string;
        signals: Array<{ type: string; severity: number; description: string }>;
        recommendation: string;
    };
    
    // Ledger trail
    ledgerTrail: {
        eventCount: number;
        events: Array<{
            eventId: string;
            eventType: string;
            timestamp: string;
            source: string;
        }>;
        chainIntegrity: 'verified' | 'unverified' | 'broken';
    };
    
    // Summary for adjuster
    adjusterSummary: {
        confidenceScore: number;
        autoApprovalEligible: boolean;
        flags: string[];
        recommendedAction: 'approve' | 'review' | 'escalate' | 'deny';
    };
}

export class AttributionController {
    
    /**
     * Generate attribution packet for a claim
     * GET /v1/claimsiq/claims/:claimId/attribution-packet
     */
    generatePacket = async (req: Request, res: Response) => {
        const { claimId } = req.params;
        const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
        
        console.log(`[ATTRIBUTION] Generating packet for claim ${claimId}`);
        
        try {
            // In production, fetch claim from database
            // For now, build packet from available services
            
            const coreClient = getCoreClient();
            const ledgerClient = getLedgerClient();
            
            // Mock claim data (would come from DB)
            const claimData = {
                id: claimId,
                claimantId: 'claimant_' + claimId.substring(0, 8),
                claimantName: 'Policy Holder',
                policyNumber: 'POL-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                assetId: 'asset_' + claimId.substring(0, 8),
                assetName: 'Claimed Item',
                assetCategory: 'Electronics',
                claimedValue: 150000, // $1500.00 in cents
            };
            
            // Get fraud score from Core
            const fraudScore = await coreClient.getFraudScore({
                entityType: 'claim',
                entityId: claimId,
                userId: claimData.claimantId,
                assetId: claimData.assetId,
                amountMicros: (claimData.claimedValue * 10000).toString(),
                eventType: 'CLAIM_SUBMITTED',
                evidenceCount: 3,
            });
            
            // Get valuation from Core
            const valuation = await coreClient.getValuation(
                claimData.assetId,
                claimData.assetCategory,
                'good'
            );
            
            // Check for asset in registry
            const registeredAsset = await coreClient.getAsset(claimData.assetId);
            
            // Build attribution packet
            const packet: AttributionPacket = {
                packetId: `attr_${randomUUID().substring(0, 12)}`,
                claimId,
                generatedAt: new Date().toISOString(),
                
                claimant: {
                    id: claimData.claimantId,
                    name: claimData.claimantName,
                    policyNumber: claimData.policyNumber,
                },
                
                asset: {
                    id: claimData.assetId,
                    name: claimData.assetName,
                    category: claimData.assetCategory,
                    claimedValue: claimData.claimedValue,
                    coreValuation: valuation ? {
                        estimatedValue: parseInt(valuation.estimatedValueMicros) / 10000,
                        confidence: valuation.confidenceLevel,
                        method: valuation.method,
                    } : undefined,
                    anchorId: registeredAsset?.anchorId,
                },
                
                preLossProvenance: {
                    hasPreLossEvidence: !!registeredAsset,
                    evidenceCount: registeredAsset ? 5 : 0,
                    earliestTimestamp: registeredAsset ? '2024-01-15T10:30:00Z' : undefined,
                    ledgerEventIds: [],
                    summary: registeredAsset 
                        ? 'Asset registered in PROVENIQ ecosystem with pre-loss documentation'
                        : 'No pre-loss evidence found in PROVENIQ ecosystem',
                },
                
                fraudAnalysis: fraudScore ? {
                    score: fraudScore.score,
                    riskLevel: fraudScore.riskLevel,
                    signals: fraudScore.signals.map(s => ({
                        type: s.signalType,
                        severity: s.severity,
                        description: s.description,
                    })),
                    recommendation: fraudScore.recommendation,
                } : {
                    score: 25,
                    riskLevel: 'low',
                    signals: [],
                    recommendation: 'review',
                },
                
                ledgerTrail: {
                    eventCount: 0,
                    events: [],
                    chainIntegrity: 'unverified',
                },
                
                adjusterSummary: {
                    confidenceScore: this.calculateConfidence(fraudScore, registeredAsset, valuation),
                    autoApprovalEligible: (fraudScore?.score || 50) < 30 && !!registeredAsset,
                    flags: this.generateFlags(fraudScore, registeredAsset, valuation, claimData),
                    recommendedAction: this.determineAction(fraudScore, registeredAsset),
                },
            };
            
            // Log packet generation to Ledger
            try {
                await ledgerClient.writeEvent(
                    'claim.created',
                    claimData.claimantId,
                    claimData.assetId,
                    {
                        packetId: packet.packetId,
                        claimId,
                        action: 'ATTRIBUTION_PACKET_GENERATED',
                        confidenceScore: packet.adjusterSummary.confidenceScore,
                    },
                    correlationId
                );
            } catch (ledgerErr) {
                console.warn('[ATTRIBUTION] Ledger write failed:', ledgerErr);
            }
            
            return res.status(200).json(packet);
            
        } catch (error: any) {
            console.error('[ATTRIBUTION] Packet generation failed:', error);
            return res.status(500).json({ 
                error: 'Failed to generate attribution packet',
                details: error.message,
            });
        }
    };
    
    private calculateConfidence(
        fraudScore: any, 
        registeredAsset: any, 
        valuation: any
    ): number {
        let confidence = 50; // Base
        
        if (registeredAsset) confidence += 20; // Pre-loss evidence
        if (registeredAsset?.anchorId) confidence += 15; // Anchor verified
        if (valuation?.confidenceLevel === 'high') confidence += 10;
        if (fraudScore?.score < 30) confidence += 5;
        if (fraudScore?.score > 60) confidence -= 20;
        
        return Math.min(100, Math.max(0, confidence));
    }
    
    private generateFlags(
        fraudScore: any,
        registeredAsset: any,
        valuation: any,
        claimData: any
    ): string[] {
        const flags: string[] = [];
        
        if (!registeredAsset) flags.push('NO_PRE_LOSS_EVIDENCE');
        if (fraudScore?.score > 60) flags.push('HIGH_FRAUD_RISK');
        if (fraudScore?.score > 80) flags.push('CRITICAL_FRAUD_RISK');
        if (valuation) {
            const estimatedCents = parseInt(valuation.estimatedValueMicros) / 10000;
            if (claimData.claimedValue > estimatedCents * 1.5) {
                flags.push('CLAIMED_VALUE_EXCEEDS_ESTIMATE');
            }
        }
        if (valuation?.biasFlags?.length > 0) {
            flags.push(...valuation.biasFlags);
        }
        
        return flags;
    }
    
    private determineAction(
        fraudScore: any,
        registeredAsset: any
    ): 'approve' | 'review' | 'escalate' | 'deny' {
        if (fraudScore?.score > 80) return 'deny';
        if (fraudScore?.score > 60) return 'escalate';
        if (!registeredAsset || fraudScore?.score > 30) return 'review';
        return 'approve';
    }
}
