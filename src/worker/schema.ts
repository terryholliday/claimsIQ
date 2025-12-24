
import { z } from 'zod';

// Re-export shared schemas for worker usage
// This avoids deep relative imports if the worker is inside the same repo
// or allows easy copy-paste if extracted.

export const IntStringSchema = z.string().regex(/^-?\d+$/);

export const ClaimDecisionEnum = z.enum(["PAY", "DENY", "REVIEW"]);
export type ClaimDecision = z.infer<typeof ClaimDecisionEnum>;

export const ClaimOpenedEventSchema = z.object({
    event_type: z.literal("CLAIM_OPENED"),
    schema_version: z.string(),
    correlation_id: z.string(),
    idempotency_key: z.string(),
    occurred_at: z.string(),
    producer: z.string(),
    producer_version: z.string(),
    subject: z.string(),
    payload: z.object({
        claim_id: z.string().regex(/^claim_[a-zA-Z0-9-]+$/),
        asset_id: z.string(),
        trigger_event_id: z.string(),
        trigger_event_type: z.string(),
    }),
});

export const ClaimDecisionRecordedEventSchema = z.object({
    event_type: z.literal("CLAIM_DECISION_RECORDED"),
    schema_version: z.string(),
    correlation_id: z.string(),
    idempotency_key: z.string(),
    occurred_at: z.string(),
    producer: z.string(),
    producer_version: z.string(),
    subject: z.string(),
    payload: z.object({
        claim_id: z.string().regex(/^claim_[a-zA-Z0-9-]+$/),
        decision: ClaimDecisionEnum,
        amount_micros: IntStringSchema,
        currency: z.string().length(3),
    }),
});

export const ClaimPayoutAuthorizedEventSchema = z.object({
    event_type: z.literal("CLAIM_PAYOUT_AUTHORIZED"),
    schema_version: z.string(),
    correlation_id: z.string(),
    idempotency_key: z.string(),
    occurred_at: z.string(),
    producer: z.string(),
    producer_version: z.string(),
    subject: z.string(),
    payload: z.object({
        claim_id: z.string().regex(/^claim_[a-zA-Z0-9-]+$/),
        amount_micros: IntStringSchema,
        currency: z.string().length(3),
        authorized_by_event_id: z.string(),
    }),
});

export const LedgerEventSchema = z.discriminatedUnion("event_type", [
    ClaimOpenedEventSchema,
    ClaimDecisionRecordedEventSchema,
    ClaimPayoutAuthorizedEventSchema,
    z.object({ event_type: z.literal("ANCHOR_SEAL_BROKEN"), payload: z.any() }).passthrough(),
]);

export type LedgerEvent = z.infer<typeof LedgerEventSchema>;
