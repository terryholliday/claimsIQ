/**
 * @file src/api/claims.controller.ts
 * @description Claims Orchestration Layer (REST Controller).
 */

import { Request, Response } from 'express';
import { ClaimIntakeService } from '../modules/claims/intake.service';
import { LedgerService } from '../modules/ledger/ledger.service';
import { IntelligenceService } from '../modules/intelligence/intelligence.service';
import { AuditService } from '../modules/audit/audit.service';

export class ClaimsController {
    private intakeService: ClaimIntakeService;
    private ledgerService: LedgerService;
    private intelligenceService: IntelligenceService;
    private auditService: AuditService;

    constructor() {
        this.intakeService = new ClaimIntakeService();
        this.ledgerService = new LedgerService();
        this.intelligenceService = new IntelligenceService();
        this.auditService = new AuditService();
    }

    /**
     * POST /api/v1/claims
     * The Submission Gate.
     */
    public submitClaim = async (req: Request, res: Response): Promise<void> => {
        console.log('[API] New Claim Submission Received');

        try {
            // 1. INTAKE (Intake Module)
            const intakeResult = this.intakeService.ingest(req.body);
            if (!intakeResult.success) {
                console.warn('[API] Intake Failed:', intakeResult.error);
                res.status(400).json({ error: 'Validation Error', details: intakeResult.error });
                return;
            }
            const claim = intakeResult.data;
            console.log(`[API] Intake Passed for Claim ${claim.id}`);

            // 2. VERIFY (Ledger Module) - Async
            const ledgerResult = await this.ledgerService.verifyAsset(claim.asset_id, claim.claimant_did);
            // Note: We don't fail 500 on application logic error (e.g. Ledger return success=false is rare unless network down)
            // If ledger is unreachable, we treat it as 500.
            if (!ledgerResult.success) {
                console.error('[API] Ledger Connection Failed:', ledgerResult.error);
                res.status(502).json({ error: 'Ledger Unreachable' }); // 502 Bad Gateway
                return;
            }
            const verification = ledgerResult.data;
            console.log(`[API] Ledger Verification Complete. Match: ${verification.ownership_match}`);

            // 3. DECIDE (Intelligence Module) - Sync
            const decision = this.intelligenceService.processClaim(claim, verification);
            console.log(`[API] Decision Computed: ${decision.decision}`);

            // 4. LOCK (Audit Module) - Async
            const auditResult = await this.auditService.commit(decision);
            if (!auditResult.success) {
                // Tamper attempt or duplicate
                console.warn('[API] Audit Lock Failed:', auditResult.error);
                res.status(409).json({ error: 'Conflict: Claim already processed' });
                return;
            }

            console.log(`[API] Request Complete. Seal: ${auditResult.data}`);

            // 5. RETURN
            res.status(201).json({
                message: 'Claim Processed Successfully',
                decision: decision,
                seal: auditResult.data
            });

        } catch (error) {
            console.error('[API] Critical System Error:', error);
            res.status(500).json({ error: 'Internal System Error' });
        }
    }

    /**
     * GET /api/v1/claims/:id
     * Status Check.
     */
    public getClaimStatus = async (req: Request, res: Response): Promise<void> => {
        const claimId = req.params.id;
        const result = this.auditService.getRecord(claimId);

        if (!result.success) {
            res.status(404).json({ error: 'Claim Not Found' });
            return;
        }

        res.status(200).json(result.data);
    }
}
