/**
 * @file src/integration/fraud-path.ts
 * @description Integration Test: Fraud Vector.
 * Simulates a stolen asset claim (Ledger Mismatch).
 * Expected Result: DENY (Hard Gate).
 */

import { ClaimIntakeService } from '../modules/claims/intake.service';
import { LedgerService } from '../modules/ledger/ledger.service';
import { IntelligenceService } from '../modules/intelligence/intelligence.service';
import { AuditService } from '../modules/audit/audit.service';

async function runFraudPath() {
    console.log("=== STARTING CLAIMS IQ 'FRAUD VECTOR' SIMULATION ===\n");

    const intakeService = new ClaimIntakeService();
    const ledgerService = new LedgerService();
    const intelligenceService = new IntelligenceService();
    const auditService = new AuditService();

    // Payload with 'asset_stolen_' prefix to trigger mock fraud logic
    const rawPayload = {
        id: crypto.randomUUID(),
        intake_timestamp: new Date().toISOString(),
        policy_snapshot_id: "pol_premium_2025",
        claimant_did: "did:proveniq:user:bad_actor",
        asset_id: "asset_stolen_diamond",
        incident_vector: {
            type: "THEFT",
            location: { type: "Point", coordinates: [0, 0] },
            severity: 10,
            description_hash: "hash_suspicious"
        },
        status: "INTAKE"
    };

    console.log(`[STEP 1] INTAKE: Submitting Payload...`);
    const intakeResult = intakeService.ingest(rawPayload);
    if (!intakeResult.success) throw new Error("Intake Failed unexpectedly");
    const claim = intakeResult.data;
    console.log(`[SUCCESS] Intake Gate Passed.\n`);

    console.log(`[STEP 2] LEDGER: Verifying Asset ${claim.asset_id}...`);
    const ledgerResult = await ledgerService.verifyAsset(claim.asset_id, claim.claimant_did);
    if (!ledgerResult.success) throw new Error("Ledger Failed unexpectedly");
    const verification = ledgerResult.data;
    console.log(`[SUCCESS] Ledger Adapter Response Received.`);
    console.log(` > Ownership Match: ${verification.ownership_match} (EXPECTED: false)\n`);

    console.log(`[STEP 3] INTELLIGENCE: Calculating Decision...`);
    const decision = intelligenceService.processClaim(claim, verification);

    console.log(`[SUCCESS] Decision Finalized.`);
    console.log(` > OUTCOME: ${decision.decision} (EXPECTED: DENY)`);
    console.log(` > SCORE: ${decision.confidence_score * 100}`);
    console.log(` > RATIONALE: ${decision.regulatory_rationale}\n`);

    console.log(`[STEP 4] AUDIT: Persisting Record...`);
    const auditResult = await auditService.commit(decision);
    if (!auditResult.success) throw new Error("Audit Failed unexpectedly");
    console.log(` > SEAL: ${auditResult.data}`);

    console.log("\n=== FRAUD SIMULATION COMPLETE: CLAIM REJECTED ===");
}

runFraudPath().catch(console.error);
