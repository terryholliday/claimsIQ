/**
 * ============================================
 * PROVENIQ CLAIMSIQ - ROUTE EXPORTS
 * ============================================
 */

import { Router } from 'express';
import claimsRoutes from './claims.routes';

const router = Router();

router.use('/claims', claimsRoutes);

export default router;
