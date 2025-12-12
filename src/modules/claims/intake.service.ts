import { ClaimObject, Result } from '../../shared/types';
import { ClaimSchema } from './validators';
import { z } from 'zod';

export class ClaimIntakeService {
    /**
     * Ingests a raw payload and strictly validates it against the ClaimSchema.
     * This operates as a gatekeeper: invalid data is rejected immediately.
     * 
     * @param payload Unknown input data from API/Webhook
     * @returns Result<ClaimObject> Success with trusted data or Failure with validation error
     */
    public ingest(payload: unknown): Result<ClaimObject> {
        const result = ClaimSchema.safeParse(payload);

        if (!result.success) {
            return {
                success: false,
                error: result.error,
            };
        }

        // Zod infers the type, but strict return type ensures conformity to ClaimObject
        return {
            success: true,
            data: result.data as ClaimObject,
        };
    }
}

/*
 * UNIT TEST USAGE BLOCK
 * 
 * // 1. Valid Payload
 * const validResult = new ClaimIntakeService().ingest({
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   intake_timestamp: "2025-12-12T10:00:00Z",
 *   policy_snapshot_id: "pol_123",
 *   claimant_did: "did:eth:0x123...",
 *   asset_id: "asset_999",
 *   incident_vector: {
 *     type: "THEFT",
 *     location: { type: "Point", coordinates: [40.7, -74.0] },
 *     severity: 10,
 *     description_hash: "hash_xyz"
 *   },
 *   status: "INTAKE"
 * }); 
 * // -> { success: true, data: ... }
 * 
 * // 2. Invalid Payload (Severity out of bounds)
 * const invalidResult = new ClaimIntakeService().ingest({
 *   ...validPayload,
 *   incident_vector: { ...validPayload.incident_vector, severity: 11 }
 * });
 * // -> { success: false, error: ZodError }
 */
