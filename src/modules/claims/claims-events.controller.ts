/**
 * @file src/modules/claims/claims-events.controller.ts
 * @description Claim Lifecycle Events Controller
 * 
 * POST /v1/claimsiq/claims/{claimId}/events
 * Records claim lifecycle events from external systems.
 */

import { Request, Response } from 'express';
import { getLedgerClient } from '../../infrastructure/ledger-client';
import { getEventBus } from '../../infrastructure/event-bus';
import { getCorrelationId } from '../../middleware/auth.middleware';

export type ClaimEventType = 
    | 'INTAKE'
    | 'VERIFICATION_STARTED'
    | 'VERIFICATION_COMPLETE'
    | 'DECISION_PENDING'
    | 'DECISION_MADE'
    | 'PAYMENT_INITIATED'
    | 'PAYMENT_COMPLETE'
    | 'SALVAGE_INITIATED'
    | 'CLOSED'
    | 'REOPENED'
    | 'FRAUD_FLAGGED';

interface ClaimEventRequest {
    eventType: ClaimEventType;
    payload?: Record<string, unknown>;
    idempotencyKey?: string;
}

// Idempotency store (production: Redis/database)
const processedEvents = new Map<string, { eventId: string; timestamp: string }>();
const ALLOWED_EVENT_TYPES: ClaimEventType[] = [
    'INTAKE',
    'VERIFICATION_STARTED',
    'VERIFICATION_COMPLETE',
    'DECISION_PENDING',
    'DECISION_MADE',
    'PAYMENT_INITIATED',
    'PAYMENT_COMPLETE',
    'SALVAGE_INITIATED',
    'CLOSED',
    'REOPENED',
    'FRAUD_FLAGGED',
];

export class ClaimsEventsController {
    /**
     * POST /v1/claimsiq/claims/:claimId/events
     * Record claim lifecycle event
     */
    public recordEvent = async (req: Request, res: Response): Promise<void> => {
        const { claimId } = req.params;
        const { eventType, payload, idempotencyKey } = req.body as ClaimEventRequest;
        const correlationId = getCorrelationId(req);

        if (!req.serviceAuth?.walletId) {
            res.status(401).json({
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: 'Service authentication required',
                    details: {}
                },
                correlationId,
                timestamp: new Date().toISOString()
            });
            return;
        }

        console.log(`[CLAIMS EVENTS] Recording ${eventType} for claim ${claimId}`);

        // Validate required fields
        if (!eventType) {
            res.status(400).json({
                error: {
                    code: 'MISSING_EVENT_TYPE',
                    message: 'eventType is required',
                    details: { validTypes: ALLOWED_EVENT_TYPES }
                },
                correlationId,
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
            res.status(400).json({
                error: {
                    code: 'INVALID_EVENT_TYPE',
                    message: 'eventType is not allowed',
                    details: { validTypes: ALLOWED_EVENT_TYPES }
                },
                correlationId,
                timestamp: new Date().toISOString()
            });
            return;
        }

        // Idempotency check
        if (idempotencyKey) {
            const existing = processedEvents.get(idempotencyKey);
            if (existing) {
                console.log(`[CLAIMS EVENTS] Idempotent replay for key ${idempotencyKey}`);
                res.status(200).json({
                    eventId: existing.eventId,
                    claimId,
                    eventType,
                    status: 'ALREADY_PROCESSED',
                    processedAt: existing.timestamp,
                    correlationId
                });
                return;
            }
        }

        try {
            const ledgerClient = getLedgerClient();
            const eventBus = getEventBus();

            // Write to Ledger
            const ledgerResult = await ledgerClient.writeEvent(
                'claim.created', // Using claim.created as generic claim event
                req.serviceAuth.walletId,
                claimId,
                {
                    claimEventType: eventType,
                    ...payload
                },
                correlationId
            );

            // Publish to event bus if significant event
            if (['DECISION_MADE', 'PAYMENT_COMPLETE', 'CLOSED', 'FRAUD_FLAGGED'].includes(eventType)) {
                await eventBus.publish(
                    eventType === 'CLOSED' ? 'claim.settled' : 'claim.created',
                    req.serviceAuth?.walletId || 'system',
                    { claimId, eventType, ...payload },
                    { claimId, correlationId }
                );
            }

            // Store idempotency key
            if (idempotencyKey) {
                processedEvents.set(idempotencyKey, {
                    eventId: ledgerResult.eventId,
                    timestamp: ledgerResult.timestamp
                });
            }

            res.status(201).json({
                eventId: ledgerResult.eventId,
                claimId,
                eventType,
                status: 'RECORDED',
                ledgerBlock: ledgerResult.blockNumber,
                hash: ledgerResult.hash,
                correlationId,
                timestamp: ledgerResult.timestamp
            });

        } catch (error) {
            console.error(`[CLAIMS EVENTS] Error recording event:`, error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to record claim event',
                    details: {}
                },
                correlationId,
                timestamp: new Date().toISOString()
            });
        }
    };
}
