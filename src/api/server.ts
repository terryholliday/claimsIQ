/**
 * @file src/api/server.ts
 * @description Main API Access Point.
 */

import express, { Express, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ClaimsController } from './claims.controller';
import { AttributionController } from './attribution.controller';
import { SalvageController } from '../modules/salvage/salvage.controller';
import { ProvenanceController } from '../modules/provenance/provenance.controller';
import { ClaimsEventsController } from '../modules/claims/claims-events.controller';
import { serviceAuthMiddleware } from '../middleware/auth.middleware';
import { initializeDatabase } from '../infrastructure/database';
import { getClaimsRepository } from '../infrastructure/claims-repository';

const app: Express = express();
const port = process.env.PORT || 3005;

// Middleware
app.use(express.json());
app.use(serviceAuthMiddleware); // JWT + Service Header validation

// Controllers
const claimsController = new ClaimsController();
const attributionController = new AttributionController();
const salvageController = new SalvageController();
const provenanceController = new ProvenanceController();
const claimsEventsController = new ClaimsEventsController();

// Routes
// 1. Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', service: 'ClaimsIQ' });
});

// 2. Claims Endpoints (DNA Contract: /v1/claimsiq/...)
app.post('/v1/claimsiq/claims', claimsController.submitClaim);
app.get('/v1/claimsiq/claims/:claimId/status', claimsController.getClaimStatus);
app.post('/v1/claimsiq/claims/:claimId/events', claimsEventsController.recordEvent);

// 3. Pre-Loss Provenance Endpoint (DNA Contract requirement)
app.get('/v1/claimsiq/items/:itemId/preloss-provenance', provenanceController.getPreLossProvenance);

// 4. Salvage Endpoints (ClaimsIQ → Bids Integration)
app.post('/v1/claimsiq/claims/:claimId/salvage', salvageController.initiateSalvage);
app.get('/v1/claimsiq/claims/:claimId/salvage', salvageController.getClaimSalvage);
app.post('/v1/claimsiq/salvage/:manifestId/list-on-bids', salvageController.listOnBids);
app.get('/v1/claimsiq/salvage/:manifestId', salvageController.getManifest);

// 5. Shrinkage ingest from OPS (with persistence)
app.post('/v1/claimsiq/claims/shrinkage', async (req: Request, res: Response) => {
    const body = req.body;
    if (!body || !body.payload) {
        return res.status(400).json({ error: 'Missing event payload' });
    }
    
    const correlationId = body.correlation_id || randomUUID();
    const payload = body.payload;

    try {
        const repo = getClaimsRepository();
        const record = await repo.createShrinkageClaim({
            eventId: payload.eventId || randomUUID(),
            timestamp: payload.timestamp || new Date().toISOString(),
            locationId: payload.locationId || 'unknown',
            businessName: payload.businessName,
            productId: payload.productId || 'unknown',
            productName: payload.productName,
            quantityLost: payload.quantityLost || 0,
            unitCostCents: payload.unitCostCents || 0,
            totalLossCents: payload.totalLossCents || 0,
            shrinkageType: payload.shrinkageType || 'UNKNOWN',
            detectedBy: payload.detectedBy || 'MANUAL',
        }, correlationId);

        console.log('[CLAIMSIQ] shrinkage persisted', { eventId: record.event_id, correlationId });

        return res.status(202).json({
            status: 'accepted',
            claimId: record.event_id,
            correlationId,
            receivedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[CLAIMSIQ] shrinkage persist failed:', error);
        // Fallback to logging only
        const claimId = randomUUID();
        console.log('[CLAIMSIQ] shrinkage logged (no DB)', { claimId, correlationId, payload });
        return res.status(202).json({
            status: 'accepted',
            claimId,
            correlationId,
            receivedAt: new Date().toISOString(),
            warning: 'Persistence unavailable, logged only',
        });
    }
});

// 6. Deposit dispute ingest from PROPERTIES (with persistence)
app.post('/v1/claimsiq/claims/deposit', async (req: Request, res: Response) => {
    const body = req.body;
    if (!body || !body.id) {
        return res.status(400).json({ error: 'Missing claim data' });
    }

    try {
        const repo = getClaimsRepository();
        const record = await repo.createDepositClaim({
            id: body.id,
            intake_timestamp: body.intake_timestamp || new Date().toISOString(),
            policy_snapshot_id: body.policy_snapshot_id || '',
            claimant_did: body.claimant_did || '',
            asset_id: body.asset_id || '',
            incident_vector: body.incident_vector || { type: 'PROPERTY_DAMAGE', severity: 5, description_hash: '' },
            claim_type: body.claim_type || 'DEPOSIT_DISPUTE',
            lease_id: body.lease_id,
            evidence: body.evidence || {},
        });

        console.log('[CLAIMSIQ] deposit claim persisted', { claimId: record.claim_id });

        return res.status(202).json({
            status: 'accepted',
            claimId: record.claim_id,
            correlationId: randomUUID(),
            receivedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[CLAIMSIQ] deposit persist failed:', error);
        // Fallback to logging only
        console.log('[CLAIMSIQ] deposit logged (no DB)', { claimId: body.id, body });
        return res.status(202).json({
            status: 'accepted',
            claimId: body.id,
            correlationId: randomUUID(),
            receivedAt: new Date().toISOString(),
            warning: 'Persistence unavailable, logged only',
        });
    }
});

// Legacy routes (backward compatibility - deprecate in v2)
app.post('/api/v1/claims', claimsController.submitClaim);
app.get('/api/v1/claims/:id', claimsController.getClaimStatus);

// Start Server
if (require.main === module) {
    // Initialize database schema
    initializeDatabase()
        .then(() => {
            app.listen(port, () => {
                console.log(`[SYSTEM] ClaimsIQ API listening at http://localhost:${port}`);
            });
        })
        .catch((err) => {
            console.warn('[SYSTEM] Database init failed, running without persistence:', err.message);
            app.listen(port, () => {
                console.log(`[SYSTEM] ClaimsIQ API listening at http://localhost:${port} (no DB)`);
            });
        });
}

export default app;
