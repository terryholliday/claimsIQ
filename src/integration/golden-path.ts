/**
 * @file src/integration/golden-path.ts
 * @description Integration Test: The Golden Path.
 * Simulates the flow of a valid claim through the entire ClaimsIQ State Machine.
 * Intake -> Ledger -> Intelligence -> Audit.
 */

import { ClaimIntakeService } from '../modules/claims/intake.service';
import { LedgerService } from '../modules/ledger/ledger.service';
import { IntelligenceService } from '../modules/intelligence/intelligence.service';
import { AuditService } from '../modules/audit/audit.service';
import { ClaimObject } from '../shared/types';

async function runGoldenPath() {
    console.log("=== STARTING CLAIMS IQ 'GOLDEN PATH' SIMULATION ===\n");

    // 1. Initialize Modules
    const intakeService = new ClaimIntakeService();
    const ledgerService = new LedgerService();
    const intelligenceService = new IntelligenceService();
    const auditService = new AuditService();

    // 2. Prepare Payload (Valid)
    // Note: asset_valid_ prefix triggers Mock Ledger success.
    const rawPayload = {
        id: crypto.randomUUID(),
        intake_timestamp: new Date().toISOString(),
        policy_snapshot_id: "pol_premium_2025",
        claimant_did: "did:proveniq:user:terry_holliday",
        asset_id: "asset_valid_rolex_submariner",
        incident_vector: {
            type: "THEFT",
            location: { type: "Point", coordinates: [40.7128, -74.0060] },
            severity: 8,
            description_hash: "hash_clean_incident_report"
        },
        status: "INTAKE"
    };

    console.log(`[STEP 1] INTAKE: Submitting Payload...`);
    const intakeResult = intakeService.ingest(rawPayload);

    if (!intakeResult.success) {
        console.error("Critical Failure at Intake:", intakeResult.error);
        process.exit(1);
    }
    const claim = intakeResult.data;
    console.log(`[SUCCESS] Intake Gate Passed. Claim ID: ${claim.id}\n`);

    // 3. Ledger Verification
    console.log(`[STEP 2] LEDGER: Verifying Asset ${claim.asset_id}...`);
    const ledgerResult = await ledgerService.verifyAsset(claim.asset_id, claim.claimant_did);

    if (!ledgerResult.success) {
        console.error("Critical Failure at Ledger Connection:", ledgerResult.error);
        process.exit(1);
    }
    const verification = ledgerResult.data;
    console.log(`[SUCCESS] Ledger Adapter Response Received.`);
    console.log(` > Asset Match: ${verification.asset_match}`);
    console.log(` > Ownership Match: ${verification.ownership_match}`);
    console.log(` > Provenance Gap: ${verification.provenance_gap}\n`);

    // 4. Intelligence Scoring
    console.log(`[STEP 3] INTELLIGENCE: Calculating Decision...`);
    const decision = intelligenceService.processClaim(claim, verification);

    console.log(`[SUCCESS] Decision Finalized.`);
    console.log(` > OUTCOME: ${decision.decision}`);
    console.log(` > SCORE: ${decision.confidence_score * 100}`); // Display as 0-100
    console.log(` > RATIONALE: ${decision.regulatory_rationale || "None (Clean)"}\n`);

    // 5. Audit Lock
    console.log(`[STEP 4] AUDIT: Persisting Record...`);
    const auditResult = await auditService.commit(decision);

    if (!auditResult.success) {
        console.error("Critical Failure at Audit Lock:", auditResult.error);
        process.exit(1);
    }
    console.log(`[SUCCESS] Record Sealed.`);
    console.log(` > SEAL: ${auditResult.data}`);

    console.log("\n=== GOLDEN PATH COMPLETE: PAYOUT APPROVED ===");
}

// Execute
runGoldenPath().catch(console.error);
