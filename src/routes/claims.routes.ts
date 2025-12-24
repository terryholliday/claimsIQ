/**
 * ============================================
 * PROVENIQ CLAIMSIQ - CLAIMS ROUTES
 * ============================================
 * 
 * API endpoints for claim intake and management.
 * FAIL LOUDLY on validation errors.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ingestClaim, getClaimById, listClaims } from '../services/claim.service';
import { getClaimAuditTrail } from '../services/audit.service';

const router = Router();

/**
 * POST /api/v1/claims
 * Submit a new claim for processing
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = req.headers['x-actor-id'] as string || 'API_CLIENT';
    const actorIp = req.ip || req.socket.remoteAddress;
    
    const result = await ingestClaim(req.body, actorId, actorIp);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    }
    
    return res.status(201).json({
      success: true,
      claim_id: result.claim_id,
      correlation_id: result.correlation_id,
      status: 'INTAKE',
      message: 'Claim submitted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/claims
 * List claims with optional filtering
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const result = await listClaims({
      status: status as any,
      limit: Math.min(limit, 100),
      offset,
    });
    
    // Serialize BigInt to string for JSON response
    const claims = result.claims.map((claim) => ({
      ...claim,
      claimed_amount: claim.claimed_amount.toString(),
      approved_amount: claim.approved_amount?.toString(),
    }));
    
    return res.json({
      claims,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/claims/:id
 * Get claim by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claim = await getClaimById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({
        error: 'Claim not found',
        claim_id: req.params.id,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Serialize BigInt
    const response = {
      ...claim,
      claimed_amount: claim.claimed_amount.toString(),
      approved_amount: claim.approved_amount?.toString(),
    };
    
    return res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/claims/:id/audit
 * Get audit trail for a claim
 */
router.get('/:id/audit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await getClaimAuditTrail(req.params.id);
    
    // Serialize BigInt
    const serialized = events.map((e) => ({
      ...e,
      sequence_number: e.sequence_number.toString(),
    }));
    
    return res.json({
      claim_id: req.params.id,
      events: serialized,
      count: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
