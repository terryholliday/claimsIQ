import { z } from 'zod';
import { ClaimStatus, IncidentType } from '../../shared/types';

// GeoJSON Point Schema
export const PointSchema = z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
});

// Incident Vector Schema
// Severity must be integer 1-10
export const IncidentVectorSchema = z.object({
    type: z.enum(['THEFT', 'DAMAGE']),
    location: PointSchema,
    severity: z.number().int().min(1).max(10),
    description_hash: z.string(),
});

// Full Claim Object Schema
// Enforces UUID, ISO8601, and strict enums
export const ClaimSchema = z.object({
    id: z.string().uuid(),
    intake_timestamp: z.string().datetime(),
    policy_snapshot_id: z.string(),
    claimant_did: z.string(),
    asset_id: z.string(),
    incident_vector: IncidentVectorSchema,
    status: z.enum(['INTAKE', 'VERIFYING', 'MANUAL_REVIEW', 'APPROVED', 'REJECTED']),
});
