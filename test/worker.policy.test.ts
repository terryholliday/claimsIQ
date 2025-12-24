
import { evaluateClaim } from '../src/worker/policyEngine';
import { describe, it, expect, vi } from 'vitest';

describe('Policy Engine', () => {

    // Mock ENV for test
    vi.stubEnv('DEMO_PROTECTION_ACTIVE', 'true');
    vi.stubEnv('DEMO_CLAIM_PAYOUT_MICROS', '5000000000');
    vi.stubEnv('DEMO_CURRENCY', 'USD');

    it('should PAY when ANCHOR_SEAL_BROKEN and Protection is Active', () => {
        const decision = evaluateClaim('ANCHOR_SEAL_BROKEN', 'asset-123');
        expect(decision.decision).toBe('PAY');
        expect(decision.amount_micros).toBe('5000000000');
    });

    it('should MONITOR/REVIEW when trigger is unknown', () => {
        const decision = evaluateClaim('SOME_OTHER_EVENT', 'asset-123');
        expect(decision.decision).toBe('REVIEW');
        expect(decision.amount_micros).toBe('0');
    });

    it('should REVIEW when Protection is Inactive', () => {
        vi.stubEnv('DEMO_PROTECTION_ACTIVE', 'false');
        const decision = evaluateClaim('ANCHOR_SEAL_BROKEN', 'asset-123');
        expect(decision.decision).toBe('REVIEW');
    });
});
