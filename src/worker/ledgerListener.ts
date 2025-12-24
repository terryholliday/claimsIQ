
import { AnchorSealBrokenEventSchema, ClaimDecisionRecordedEventSchema, ClaimOpenedEventSchema, ClaimPayoutAuthorizedEventSchema } from "./schema";
import { evaluateClaim } from "./policyEngine";
import { v4 as uuidv4 } from 'uuid';

const LEDGER_API_URL = process.env.LEDGER_API_URL || "http://localhost:5432";

// Simple in-memory cursor for demo. In prod, use SQLite/Redis.
let lastSeenCursor: string | null = null;
const PROCESSED_CACHE = new Set<string>();

export async function startWorker() {
    console.log("[ClaimsIQ Worker] Starting Ledger Listener...");
    console.log(`[ClaimsIQ Worker] Targeted Ledger: ${LEDGER_API_URL}`);

    setInterval(async () => {
        try {
            await pollLedger();
        } catch (error) {
            console.error("[ClaimsIQ Worker] Poll Error:", error);
        }
    }, 2000);
}

async function pollLedger() {
    // 1. Fetch Events
    let url = `${LEDGER_API_URL}/api/v1/events?types=ANCHOR_SEAL_BROKEN`;
    if (lastSeenCursor) {
        url += `&after=${lastSeenCursor}`;
    }

    const res = await fetch(url).catch(e => null);
    if (!res || !res.ok) return; // Silent fail on network error

    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) return;

    for (const event of events) {
        // Update cursor
        lastSeenCursor = event.event_id || event.id; // Adapt to actual response shape

        // 2. Parse Trigger
        const trigger = AnchorSealBrokenEventSchema.safeParse(event);
        if (!trigger.success) continue;

        const triggerId = event.event_id || event.id;
        const triggerType = event.event_type;
        // Asset ID might need to be resolved if not in payload. For demo, assume it's there or inferable.
        const assetId = trigger.data.payload.asset_id || "UNKNOWN_ASSET";

        await processTrigger(triggerId, triggerType, assetId);
    }
}

async function processTrigger(triggerId: string, triggerType: string, assetId: string) {
    const claimId = `claim_${triggerId}`; // Deterministic ID

    // 3. Idempotency Check (Local + Remote)
    if (PROCESSED_CACHE.has(claimId)) return;

    // Check Ledger for existing claim
    if (await checkClaimExists(claimId)) {
        PROCESSED_CACHE.add(claimId);
        return;
    }

    console.log(`[ClaimsIQ] Processing New Claim: ${claimId} (Trigger: ${triggerId})`);

    // 4. Adjudicate
    const decision = evaluateClaim(triggerType, assetId);

    // 5. Write Events
    try {
        // A. CLAIM_OPENED
        await writeEvent({
            schema_version: "1.0.0",
            created_at: new Date().toISOString(),
            correlation_id: claimId,
            idempotency_key: `idem:CLAIM_OPENED:${claimId}`,
            event_type: "CLAIM_OPENED",
            payload: {
                claim_id: claimId,
                asset_id: assetId,
                trigger_event_id: triggerId,
                trigger_event_type: triggerType
            }
        });

        // B. CLAIM_DECISION_RECORDED
        await writeEvent({
            schema_version: "1.0.0",
            created_at: new Date().toISOString(),
            correlation_id: claimId,
            idempotency_key: `idem:CLAIM_DECISION_RECORDED:${claimId}`,
            event_type: "CLAIM_DECISION_RECORDED",
            payload: {
                claim_id: claimId,
                decision: decision.decision,
                amount_micros: decision.amount_micros,
                currency: decision.currency
            }
        });

        // C. CLAIM_PAYOUT_AUTHORIZED (if PAY)
        if (decision.decision === "PAY") {
            await writeEvent({
                schema_version: "1.0.0",
                created_at: new Date().toISOString(),
                correlation_id: claimId, // Same correlation ID
                idempotency_key: `idem:CLAIM_PAYOUT_AUTHORIZED:${claimId}`,
                event_type: "CLAIM_PAYOUT_AUTHORIZED",
                payload: {
                    claim_id: claimId,
                    amount_micros: decision.amount_micros,
                    currency: decision.currency,
                    authorized_by_event_id: `decision_event_for_${claimId}` // approximation
                }
            });
            console.log(`[ClaimsIQ] Payout AUTHORIZED for ${claimId}`);
        } else {
            console.log(`[ClaimsIQ] Claim ${claimId} resolved as ${decision.decision}`);
        }

        PROCESSED_CACHE.add(claimId);

    } catch (e) {
        console.error(`[ClaimsIQ] Failed to write claim events for ${claimId}`, e);
    }
}

async function checkClaimExists(claimId: string): Promise<boolean> {
    // In real app, query Ledger by type=CLAIM_OPENED & payload.claim_id=...
    // For demo, we rely on write failure or just blindly write (Ledger should dedupe by idempotency_key)
    // But prompted requires check.
    const url = `${LEDGER_API_URL}/api/v1/events?types=CLAIM_OPENED&correlation_id=${claimId}`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            return Array.isArray(data) && data.length > 0;
        }
    } catch (e) { }
    return false;
}

async function writeEvent(eventBody: any) {
    // Add crypto signature here if required by Ledger contracts
    const res = await fetch(`${LEDGER_API_URL}/api/v1/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventBody)
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Ledger Write Failed: ${res.status} ${txt}`);
    }
}
