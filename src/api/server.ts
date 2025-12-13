/**
 * @file src/api/server.ts
 * @description Main API Access Point.
 */

import express, { Express, Request, Response } from 'express';
import { ClaimsController } from './claims.controller';

const app: Express = express();
const port = process.env.PORT || 3005;

// Middleware
app.use(express.json());

// Controllers
const claimsController = new ClaimsController();

// Routes
// 1. Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', service: 'ClaimsIQ' });
});

// 2. Claims Endpoints
app.post('/api/v1/claims', claimsController.submitClaim);
app.get('/api/v1/claims/:id', claimsController.getClaimStatus);

// Start Server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`[SYSTEM] ClaimsIQ API listening at http://localhost:${port}`);
    });
}

export default app;
