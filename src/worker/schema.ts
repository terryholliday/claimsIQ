
import { z } from "zod";

// =============================================================================
// SHARED TYPES (Mirroring @proveniq/contracts)
// =============================================================================

export const IntStringSchema = z
    .string()
    .regex(/^-?\d+$/, "Must be an integer string");

export const BaseEventSchema = z.object({
    schema_version: z.literal("1.0.0"),
    created_at: z.string().datetime(),
    correlation_id: z.string().uuid(),
    idempotency_key: z.string().min(10),
});

export const ClaimDecisionEnum = z.enum(["PAY", "DENY", "REVIEW"]);
export type ClaimDecision = z.infer<typeof ClaimDecisionEnum>;

// =============================================================================
// INCOMING TRIGGERS
// =============================================================================

export const AnchorSealBrokenEventSchema = BaseEventSchema.extend({
    event_type: z.literal("ANCHOR_SEAL_BROKEN"),
    payload: z.object({
        anchor_id: z.string(),
        asset_id: z.string().optional(), // Often inferred in real systems, but useful if present
        seal_id: z.string(),
        timestamp: z.string(),
        location: z.record(z.unknown()).optional(),
    }).passthrough(), // Allow other fields
});

// =============================================================================
// OUTGOING EVENTS
// =============================================================================

export const ClaimOpenedEventSchema = BaseEventSchema.extend({
    event_type: z.literal("CLAIM_OPENED"),
    payload: z.object({
        claim_id: z.string().startsWith("claim_"),
        asset_id: z.string(),
        trigger_event_id: z.string(),
        trigger_event_type: z.string(),
    }),
});

export const ClaimDecisionRecordedEventSchema = BaseEventSchema.extend({
    event_type: z.literal("CLAIM_DECISION_RECORDED"),
    payload: z.object({
        claim_id: z.string().startsWith("claim_"),
        decision: ClaimDecisionEnum,
        amount_micros: IntStringSchema,
        currency: z.string().length(3),
    }),
});

export const ClaimPayoutAuthorizedEventSchema = BaseEventSchema.extend({
    event_type: z.literal("CLAIM_PAYOUT_AUTHORIZED"),
    payload: z.object({
        claim_id: z.string().startsWith("claim_"),
        amount_micros: IntStringSchema,
        currency: z.string().length(3),
        authorized_by_event_id: z.string(),
    }),
});

export type AnchorSealBrokenEvent = z.infer<typeof AnchorSealBrokenEventSchema>;
export type ClaimOpenedEvent = z.infer<typeof ClaimOpenedEventSchema>;
export type ClaimDecisionRecordedEvent = z.infer<typeof ClaimDecisionRecordedEventSchema>;
export type ClaimPayoutAuthorizedEvent = z.infer<typeof ClaimPayoutAuthorizedEventSchema>;
