/**
 * @file src/infrastructure/capital-webhook.ts
 * @description Webhook publisher for notifying Capital of PAY decisions.
 * 
 * Flow: ClaimsIQ PAY Decision → Capital Webhook → Payout Initiated
 */

import { createHash } from 'crypto';

interface DecisionPayload {
  claim_id: string;
  status: 'PAY' | 'DENY';
  amount_approved_cents: number;
  currency: string;
  recipient_did: string;
  audit_seal: string;
  decision_timestamp: string;
}

interface WebhookResult {
  success: boolean;
  status_code?: number;
  payout_status?: string;
  error?: string;
}

export class CapitalWebhookPublisher {
  private readonly capitalWebhookUrl: string;
  private readonly webhookSecret: string;
  private readonly enabled: boolean;

  constructor() {
    this.capitalWebhookUrl = process.env.CAPITAL_WEBHOOK_URL || 'http://localhost:3001/webhooks/claimsiq';
    this.webhookSecret = process.env.CAPITAL_WEBHOOK_SECRET || '';
    this.enabled = !!process.env.CAPITAL_WEBHOOK_URL;
  }

  /**
   * Notify Capital of a PAY decision
   */
  async notifyPayDecision(decision: DecisionPayload): Promise<WebhookResult> {
    if (!this.enabled) {
      console.log('[CAPITAL-WEBHOOK] Disabled (CAPITAL_WEBHOOK_URL not set)');
      return { success: false, error: 'Webhook not configured' };
    }

    if (decision.status !== 'PAY') {
      console.log('[CAPITAL-WEBHOOK] Skipping non-PAY decision');
      return { success: true, error: 'Non-PAY decision skipped' };
    }

    const payload = {
      event_type: 'DECISION_ISSUED',
      timestamp: new Date().toISOString(),
      decision: {
        claim_id: decision.claim_id,
        status: decision.status,
        amount_approved_cents: decision.amount_approved_cents,
        currency: decision.currency,
        recipient_did: decision.recipient_did,
        audit_seal: decision.audit_seal,
        decision_timestamp: decision.decision_timestamp,
      },
    };

    // Compute signature
    const payloadString = JSON.stringify(payload);
    const signature = createHash('sha256')
      .update(payloadString + this.webhookSecret)
      .digest('hex');

    try {
      const response = await fetch(this.capitalWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ClaimsIQ-Signature': signature,
          'X-Source-App': 'proveniq-claimsiq',
        },
        body: payloadString,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[CAPITAL-WEBHOOK] PAY decision sent | claim_id=${decision.claim_id} | payout_status=${data.payout_status}`);
        return {
          success: true,
          status_code: response.status,
          payout_status: data.payout_status,
        };
      } else {
        const errorText = await response.text();
        console.error(`[CAPITAL-WEBHOOK] Failed | status=${response.status} | error=${errorText}`);
        return {
          success: false,
          status_code: response.status,
          error: errorText,
        };
      }
    } catch (error) {
      console.error('[CAPITAL-WEBHOOK] Network error:', error);
      return {
        success: false,
        error: `Network error: ${String(error)}`,
      };
    }
  }
}

// Singleton
let publisher: CapitalWebhookPublisher | null = null;

export function getCapitalWebhookPublisher(): CapitalWebhookPublisher {
  if (!publisher) {
    publisher = new CapitalWebhookPublisher();
  }
  return publisher;
}
