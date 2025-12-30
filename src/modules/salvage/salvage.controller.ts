/**
 * @file src/modules/salvage/salvage.controller.ts
 * @description Salvage REST Controller - ClaimsIQ → Bids Integration Endpoints
 */

import { Request, Response } from 'express';
import { SalvageService } from './salvage.service';
import { AuditService } from '../audit/audit.service';
import { CreateSalvageRequest, ListOnBidsRequest, SalvageAsset } from './salvage.types';

export class SalvageController {
    private salvageService: SalvageService;
    private auditService: AuditService;

    constructor(salvageService?: SalvageService, auditService?: AuditService) {
        this.salvageService = salvageService || new SalvageService();
        this.auditService = auditService || new AuditService();
    }

    /**
     * POST /v1/claimsiq/claims/:claimId/salvage
     * Initiates salvage process for a settled claim.
     */
    public initiateSalvage = async (req: Request, res: Response): Promise<void> => {
        const { claimId } = req.params;
        const request = req.body as CreateSalvageRequest;

        console.log(`[SALVAGE API] Initiating salvage for claim ${claimId}`);

        if (!req.serviceAuth?.walletId) {
            res.status(401).json({ error: 'Service authentication required' });
            return;
        }

        // 1. Verify claim exists and is settled with PAY decision
        const claimRecord = this.auditService.getRecord(claimId);
        if (!claimRecord.success) {
            res.status(404).json({ error: 'Claim not found' });
            return;
        }

        if (claimRecord.data.decision !== 'PAY') {
            res.status(400).json({ 
                error: 'Salvage only available for paid claims',
                claimDecision: claimRecord.data.decision 
            });
            return;
        }

        // 2. Validate request
        if (!request.assets || request.assets.length === 0) {
            res.status(400).json({ error: 'At least one asset required for salvage' });
            return;
        }

        // 3. Build asset details (mock - production would fetch from database)
        const assetDetails: SalvageAsset[] = request.assets.map((assetId, index) => ({
            assetId,
            name: `Salvage Item ${index + 1}`,
            category: 'General',
            claimedValue: request.estimatedRecovery / request.assets.length * 2, // Mock original value
            estimatedRecovery: request.estimatedRecovery / request.assets.length,
            condition: 'REPAIRABLE' as const,
            imageUrls: [],
        }));

        // 4. Create manifest
        const insurerWalletId = req.serviceAuth.walletId;
        const result = await this.salvageService.createManifest(
            claimId,
            insurerWalletId,
            request,
            assetDetails
        );

        if (!result.success) {
            res.status(500).json({ error: 'Failed to create salvage manifest', details: result.error?.message });
            return;
        }

        console.log(`[SALVAGE API] Manifest created: ${result.data.id}`);

        res.status(201).json({
            message: 'Salvage manifest created',
            manifestId: result.data.id,
            claimId: result.data.claimId,
            status: result.data.status,
            assets: result.data.assets.map(a => ({
                assetId: a.assetId,
                estimatedRecovery: a.estimatedRecovery,
            })),
            totalEstimatedRecovery: result.data.totalEstimatedRecovery,
            createdAt: result.data.createdAt,
        });
    };

    /**
     * POST /v1/claimsiq/salvage/:manifestId/list-on-bids
     * Lists salvage manifest items on Bids auction platform.
     */
    public listOnBids = async (req: Request, res: Response): Promise<void> => {
        const { manifestId } = req.params;
        const request = req.body as ListOnBidsRequest;

        console.log(`[SALVAGE API] Listing manifest ${manifestId} on Bids`);

        if (!req.serviceAuth?.walletId) {
            res.status(401).json({ error: 'Service authentication required' });
            return;
        }

        // 1. Validate request
        if (!request.auctionType || !request.duration || !request.reservePrice) {
            res.status(400).json({ 
                error: 'Missing required fields',
                required: ['auctionType', 'duration', 'reservePrice']
            });
            return;
        }

        // 2. List on Bids
        const result = await this.salvageService.listOnBids(manifestId, request);

        if (!result.success) {
            const statusCode = result.error?.message === 'Manifest not found' ? 404 : 400;
            res.status(statusCode).json({ error: result.error?.message });
            return;
        }

        console.log(`[SALVAGE API] Listed on Bids: ${result.data.bidsListingIds.join(', ')}`);

        res.status(200).json(result.data);
    };

    /**
     * GET /v1/claimsiq/salvage/:manifestId
     * Gets salvage manifest details.
     */
    public getManifest = async (req: Request, res: Response): Promise<void> => {
        const { manifestId } = req.params;

        const result = this.salvageService.getManifest(manifestId);

        if (!result.success) {
            res.status(404).json({ error: 'Manifest not found' });
            return;
        }

        res.status(200).json(result.data);
    };

    /**
     * GET /v1/claimsiq/claims/:claimId/salvage
     * Gets all salvage manifests for a claim.
     */
    public getClaimSalvage = async (req: Request, res: Response): Promise<void> => {
        const { claimId } = req.params;

        const manifests = this.salvageService.getManifestsByClaimId(claimId);

        res.status(200).json({
            claimId,
            manifests,
            count: manifests.length,
        });
    };
}
