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

5-gate validation flow:
1. **Evidence Gate** - Score evidence quality
2. **Amount Gate** - Validate claim amount
3. **Fraud Gate** - Check fraud signals
4. **Type Gate** - Apply claim-type rules
5. **Approval Gate** - Calculate approved amount

Outputs: `PAY` | `DENY` | `REVIEW`

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Set GEMINI_API_KEY, DATABASE_URL
npm run dev
```

## Ecosystem Integration

- **Properties**: Receives deposit disputes on claim packet generation
- **Ops**: Receives shrinkage claims from Bishop
- **Home**: Receives insurance/warranty claims
- **Capital**: Sends PAY decisions via webhook

## License

Proprietary - PROVENIQ Technologies
