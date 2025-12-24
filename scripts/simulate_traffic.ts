// PROVENIQ CLAIMSIQ :: TRAFFIC SIMULATION
// CONTEXT: TESTING LOGIC GATES

const API_URL = 'http://127.0.0.1:3005/api/v1/claims';

// ---------------------------------------------------------
// SCENARIO 1: THE GOLDEN PATH (Valid Asset, Honest User)
// ---------------------------------------------------------
const CLAIM_CLEAN = {
    id: crypto.randomUUID(), // Added to satisfy validation
    status: 'INTAKE',       // Added to satisfy validation
    policy_snapshot_id: "pol_777",
    claimant_did: "did:proveniq:user_valid",
    asset_id: "asset_valid_001", // Triggers Mock "Success"
    incident_vector: {
        type: "THEFT",
        location: { type: "Point", coordinates: [-73.935242, 40.730610] }, // NYC
        severity: 5,
        description_hash: "sha256_of_narrative_text"
    },
    intake_timestamp: new Date().toISOString()
};

// ---------------------------------------------------------
// SCENARIO 2: THE HARD GATE (Stolen Asset / Fraud)
// ---------------------------------------------------------
const CLAIM_FRAUD = {
    ...CLAIM_CLEAN,
    id: crypto.randomUUID(),
    asset_id: "asset_stolen_999", // Triggers Mock "Ownership Mismatch"
    claimant_did: "did:proveniq:thief"
};

// ---------------------------------------------------------
// SCENARIO 3: THE SOFT GATE (Provenance Gap / Ambiguity)
// ---------------------------------------------------------
const CLAIM_SUSPICIOUS = {
    ...CLAIM_CLEAN,
    id: crypto.randomUUID(),
    asset_id: "asset_gap_555", // Triggers Mock "Provenance Gap"
};

async function testScenario(name: string, payload: any) {
    console.log(`\n--- TESTING SCENARIO: ${name} ---`);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // We expect 201 Created for all processed claims (even Denials are 'Created' decisions)
        // Or 409 if conflict, 400 if validation error.

        const result = await response.json();
        console.log(`STATUS: ${response.status}`);
        console.log("DECISION RECORD:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("CONNECTION FAILED:", error);
    }
}

async function run() {
    console.log("⚡️ INITIALIZING LIVE FIRE EXERCISE...");

    // 1. Expect APPROVED (201, Decision: PAY)
    await testScenario("CLEAN CLAIM", CLAIM_CLEAN);

    // 2. Expect REJECTED (201, Decision: DENY)
    await testScenario("FRAUD ATTEMPT", CLAIM_FRAUD);

    // 3. Expect MANUAL_REVIEW (201, Decision: FLAG)
    await testScenario("SUSPICIOUS HISTORY", CLAIM_SUSPICIOUS);
}

run();
