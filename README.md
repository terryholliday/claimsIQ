# PROVENIQ ClaimsIQ

**AI-Powered Claims Adjudication Engine**

ClaimsIQ receives claims from ecosystem apps, processes them through a decision engine, and issues PAY/DENY verdicts with cryptographic audit seals.

## Architecture

```
Properties ──┐
             ├──► ClaimsIQ ──► Capital (PAY → Payout)
Ops ─────────┘      │
Home ────────────────┘
```

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Database:** PostgreSQL (Kysely ORM)
- **AI:** Google Gemini (via Genkit)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/claimsiq/claims/deposit | Deposit dispute from Properties |
| POST | /v1/claimsiq/claims/shrinkage | Shrinkage claim from Ops |
| POST | /v1/claimsiq/claims | General claim submission |
| GET | /v1/claimsiq/claims/:id/status | Get claim status |

## Decision Engine

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

### Claims
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/claimsiq/claims` | Submit new claim |
| `GET` | `/v1/claimsiq/claims/:id/status` | Get claim status |
| `POST` | `/v1/claimsiq/claims/:id/events` | Record claim event |
| `GET` | `/v1/claimsiq/claims/:id/attribution-packet` | Generate attribution packet |

### Provenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/claimsiq/items/:id/preloss-provenance` | Get pre-loss evidence |

### Salvage
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/claimsiq/claims/:id/salvage` | Initiate salvage |
| `GET` | `/v1/claimsiq/claims/:id/salvage` | Get claim salvage |
| `POST` | `/v1/claimsiq/salvage/:id/list-on-bids` | List on Bids auction |
| `GET` | `/v1/claimsiq/salvage/:id` | Get salvage manifest |

### Inbound (from other apps)
| Method | Endpoint | Source |
|--------|----------|--------|
| `POST` | `/v1/claimsiq/claims/shrinkage` | Ops (inventory loss) |
| `POST` | `/v1/claimsiq/claims/deposit` | Properties (deposit disputes) |

## Attribution Packet

Comprehensive claim analysis bundle for adjusters:

```typescript
{
  packetId: string,
  claimId: string,
  claimant: { id, name, policyNumber },
  asset: { id, name, claimedValue, coreValuation },
  preLossProvenance: { hasEvidence, evidenceCount, ledgerEventIds },
  fraudAnalysis: { score, riskLevel, signals, recommendation },
  ledgerTrail: { eventCount, events, chainIntegrity },
  adjusterSummary: { confidenceScore, autoApprovalEligible, flags, recommendedAction }
}
```

## Integrations

| Service | Purpose |
|---------|---------|
| **Ledger (8006)** | Claim events, chain of custody |
| **Core (8000)** | Fraud scoring, valuations, asset registry |
| **Bids (3005)** | Salvage auction listings |
| **Home (9003)** | Pre-loss evidence source |
| **Properties (8001)** | Deposit dispute claims |
| **Ops** | Shrinkage claims |

## AI Analysis Flows

- **Live FNOL Analysis** — Real-time call transcription
- **Digital Field Adjuster** — Damage assessment from photos
- **Market Value Analysis** — Fair market value research
- **Fraud Detection** — Multi-signal risk scoring
- **LKQ Analysis** — Like-kind-quality replacement
- **Bundle Analysis** — Component breakdown
- **Depreciation Calculation** — ACV computation

## Environment Variables

```env
PORT=3005
DATABASE_URL=postgresql://...
LEDGER_API_URL=http://localhost:8006
CORE_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=...
```

## License

Proprietary — PROVENIQ Inc.
Proprietary - PROVENIQ Technologies
