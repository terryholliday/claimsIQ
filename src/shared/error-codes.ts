/**
 * @file src/shared/error-codes.ts
 * @description Standard Error Codes per DNA Contract Section 8
 */

export type ErrorCode = 
    | 'INVALID_CUSTODY_TRANSITION'
    | 'ITEM_NOT_FOUND'
    | 'CLAIM_NOT_FOUND'
    | 'INSUFFICIENT_PROVENANCE'
    | 'FRAUD_BLOCKED'
    | 'LEDGER_HASH_MISMATCH'
    | 'MISSING_EVENT_TYPE'
    | 'VALIDATION_ERROR'
    | 'DUPLICATE_CLAIM'
    | 'INTERNAL_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN';

export interface StandardError {
    readonly error: {
        readonly code: ErrorCode;
        readonly message: string;
        readonly details: Record<string, unknown>;
    };
    readonly correlationId: string;
    readonly timestamp: string;
}

export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
    'INVALID_CUSTODY_TRANSITION': 400,
    'ITEM_NOT_FOUND': 404,
    'CLAIM_NOT_FOUND': 404,
    'INSUFFICIENT_PROVENANCE': 422,
    'FRAUD_BLOCKED': 403,
    'LEDGER_HASH_MISMATCH': 500,
    'MISSING_EVENT_TYPE': 400,
    'VALIDATION_ERROR': 400,
    'DUPLICATE_CLAIM': 409,
    'INTERNAL_ERROR': 500,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
};

export function createErrorResponse(
    code: ErrorCode,
    message: string,
    details: Record<string, unknown>,
    correlationId: string
): StandardError {
    return {
        error: { code, message, details },
        correlationId,
        timestamp: new Date().toISOString(),
    };
}

export function getHttpStatus(code: ErrorCode): number {
    return ERROR_HTTP_STATUS[code] || 500;
}
