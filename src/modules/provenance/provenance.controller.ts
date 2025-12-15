/**
 * @file src/modules/provenance/provenance.controller.ts
 * @description Pre-Loss Provenance REST Controller
 */

import { Request, Response } from 'express';
import { ProvenanceService } from './provenance.service';

export class ProvenanceController {
    private provenanceService: ProvenanceService;

    constructor(provenanceService?: ProvenanceService) {
        this.provenanceService = provenanceService || new ProvenanceService();
    }

    /**
     * GET /v1/claimsiq/items/:itemId/preloss-provenance
     * Returns pre-loss provenance data for claims processing
     */
    public getPreLossProvenance = async (req: Request, res: Response): Promise<void> => {
        const { itemId } = req.params;

        console.log(`[PROVENANCE API] Getting pre-loss provenance for item ${itemId}`);

        const result = this.provenanceService.getPreLossProvenance(itemId);

        if (!result.success) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        res.status(200).json(result.data);
    };
}
