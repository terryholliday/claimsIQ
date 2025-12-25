# TrueArk Ecosystem Contracts

This directory contains the shared domain definitions and API contracts for the TrueArk ecosystem (MyARK, TrueManifest, Arkive).

## ID Strategy and Referencing

We use a unified identification strategy to ensure consistent referencing across services.

### Format
*   **UUID**: All database primary keys are v4 UUIDs.
*   **URN**: All entities are globally addressable via URNs.

### URN Scheme
The URN format is:
`urn:trueark:<service>:<entity>:<uuid>`

Examples:
*   `urn:trueark:myark:vault:123e4567-e89b-12d3-a456-426614174000`
*   `urn:trueark:manifest:claim:987f6543-e21b-12d3-a456-426614174000`
*   `urn:trueark:arkive:lot:abc12345-e89b-12d3-a456-426614174000`

### Cross-System Rules
1.  **Immutable References**: When an object moves between systems (e.g., Asset -> ClaimItem), we store the source URN to maintain lineage.
2.  **Snapshotting**: When a ClaimItem is created from a MyARK Asset, the Asset data is snapshotted into the ClaimItem to prevent historical revisionism if the user changes the Vault item later.
3.  **Idempotency**: All API operations allowing creation must be idempotent, relying on client-generated UUIDs or deterministic hashing where appropriate.

## Domain Model
See `domain.ts` for the canonical Typescript interfaces.
