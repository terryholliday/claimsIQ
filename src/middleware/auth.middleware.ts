/**
 * @file src/middleware/auth.middleware.ts
 * @description Authentication Middleware for ClaimsIQ
 * 
 * Implements DNA Contract requirements:
 * - Token validation (Firebase preferred, fallback dev token)
 * - X-Service-Name header check
 * - X-Correlation-Id propagation
 */

import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

export interface ServiceAuthContext {
    readonly serviceName: string;
    readonly correlationId: string;
    readonly walletId?: string;
    readonly permissions: string[];
}

declare global {
    namespace Express {
        interface Request {
            serviceAuth?: ServiceAuthContext;
        }
    }
}

// Allowed service names for inter-app communication
const ALLOWED_SERVICES = [
    'proveniq-home',
    'proveniq-ledger',
    'proveniq-core',
    'proveniq-capital',
    'proveniq-bids',
    'proveniq-claimsiq',
];

// Initialize Firebase Admin if credentials are available
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
if (!admin.apps.length && FIREBASE_PROJECT_ID) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: FIREBASE_PROJECT_ID,
    });
}
const firebaseAuth = admin.apps.length ? admin.auth() : null;

// Service permissions matrix
const SERVICE_PERMISSIONS: Record<string, string[]> = {
    'proveniq-home': ['read:provenance', 'write:claims'],
    'proveniq-ledger': ['read:claims', 'write:events'],
    'proveniq-core': ['read:claims', 'write:fraud'],
    'proveniq-capital': ['read:provenance'],
    'proveniq-bids': ['read:salvage', 'write:auction-events'],
    'proveniq-claimsiq': ['*'], // Internal service
};

/**
 * Validate token
 * Preferred: Firebase ID token
 * Fallback: mock dev token
 */
async function validateToken(token: string): Promise<{ valid: boolean; serviceName?: string; walletId?: string; claims?: any }> {
    // Preferred: Firebase
    if (firebaseAuth) {
        try {
            const decoded = await firebaseAuth.verifyIdToken(token);
            return {
                valid: true,
                serviceName: decoded.aud || 'proveniq-claimsiq',
                walletId: decoded.uid,
                claims: decoded,
            };
        } catch (err) {
            // fall through to dev token
        }
    }

    // Dev fallback: mock token "service_<name>_<random>"
    if (!token || token.length < 10) {
        return { valid: false };
    }
    const parts = token.split('_');
    if (parts.length >= 2 && parts[0] === 'service') {
        return {
            valid: true,
            serviceName: `proveniq-${parts[1]}`,
        };
    }

    // Allow any token in non-production as last resort
    if (process.env.NODE_ENV !== 'production') {
        return { valid: true, serviceName: 'proveniq-claimsiq' };
    }

    return { valid: false };
}

/**
 * Authentication middleware for service-to-service calls
 */
export function serviceAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    // 1. Extract Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Allow unauthenticated in dev
        if (process.env.NODE_ENV !== 'production') {
            req.serviceAuth = {
                serviceName: 'anonymous',
                correlationId: (req.headers['x-correlation-id'] as string) || `corr_${Date.now()}`,
                permissions: ['read:provenance', 'write:claims'],
            };
            return next();
        }
        res.status(401).json({ error: 'Missing Authorization header' });
        return;
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // 2. Validate token
    validateToken(token).then((jwtResult) => {
        if (!jwtResult.valid) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        // 3. Extract X-Service-Name header
        const serviceName = (req.headers['x-service-name'] as string) || jwtResult.serviceName || 'unknown';
        
        if (!ALLOWED_SERVICES.includes(serviceName)) {
            res.status(403).json({ error: `Unknown service: ${serviceName}` });
            return;
        }

        // 4. Extract or generate X-Correlation-Id
        const correlationId = (req.headers['x-correlation-id'] as string) || `corr_${Date.now()}`;

        // 5. Get service permissions
        const permissions = SERVICE_PERMISSIONS[serviceName] || [];

        // 6. Attach auth context to request
        req.serviceAuth = {
            serviceName,
            correlationId,
            walletId: jwtResult.walletId,
            permissions,
        };

        // 7. Log for audit
        console.log(`[AUTH] Service: ${serviceName} | Correlation: ${correlationId} | Path: ${req.path}`);

        next();
    }).catch(err => {
        console.error('[AUTH] token validation error', err);
        res.status(401).json({ error: 'Invalid token' });
    });
}

/**
 * Permission check middleware factory
 */
export function requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const auth = req.serviceAuth;

        if (!auth) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (auth.permissions.includes('*') || auth.permissions.includes(permission)) {
            next();
            return;
        }

        res.status(403).json({ 
            error: 'Insufficient permissions',
            required: permission,
            service: auth.serviceName,
        });
    };
}

/**
 * Correlation ID propagation helper
 */
export function getCorrelationId(req: Request): string {
    return req.serviceAuth?.correlationId || req.headers['x-correlation-id'] as string || `corr_${Date.now()}`;
}
