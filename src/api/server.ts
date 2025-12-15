/**
 * @file src/api/server.ts
 * @description Main API Access Point.
 */

import express, { Express, Request, Response } from 'express';
import { ClaimsController } from './claims.controller';
import { SalvageController } from '../modules/salvage/salvage.controller';
import { ProvenanceController } from '../modules/provenance/provenance.controller';
import { ClaimsEventsController } from '../modules/claims/claims-events.controller';
import { serviceAuthMiddleware } from '../middleware/auth.middleware';

const app: Express = express();
const port = process.env.PORT || 3005;

// Middleware
app.use(express.json());
app.use(serviceAuthMiddleware); // JWT + Service Header validation

// Controllers
const claimsController = new ClaimsController();
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

// Legacy routes (backward compatibility - deprecate in v2)
app.post('/api/v1/claims', claimsController.submitClaim);
app.get('/api/v1/claims/:id', claimsController.getClaimStatus);

// Start Server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`[SYSTEM] ClaimsIQ API listening at http://localhost:${port}`);
    });
}

export default app;
