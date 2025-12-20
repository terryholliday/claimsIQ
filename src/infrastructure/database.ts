/**
 * @file src/infrastructure/database.ts
 * @description Database connection and schema for ClaimsIQ persistence.
 * Uses Kysely for type-safe SQL queries with PostgreSQL.
 */

import { Kysely, PostgresDialect, Generated, ColumnType } from 'kysely';
import { Pool } from 'pg';

// === Database Types ===

export interface ClaimsTable {
  id: Generated<string>;
  claim_id: string;
  source_app: string;
  claim_type: string;
  status: string;
  
  // Claimant info
  claimant_did: string;
  policy_snapshot_id: string | null;
  
  // Asset/Subject
  asset_id: string;
  asset_type: string | null;
  
  // Incident
  incident_type: string;
  incident_severity: number;
  incident_description_hash: string | null;
  
  // Financials (stored as cents)
  amount_claimed_cents: number | null;
  amount_approved_cents: number | null;
  
  // Evidence package (JSON)
  evidence: ColumnType<object, string, string>;
  
  // Decision
  decision: string | null;
  decision_confidence: number | null;
  decision_rationale: string | null;
  audit_seal: string | null;
  
  // Timestamps
  intake_timestamp: string;
  decision_timestamp: string | null;
  created_at: Generated<Date>;
  updated_at: Date | null;
}

export interface ShrinkageClaimsTable {
  id: Generated<string>;
  event_id: string;
  correlation_id: string;
  status: string;
  
  // Location
  location_id: string;
  business_name: string | null;
  
  // Product
  product_id: string;
  product_name: string | null;
  
  // Loss details
  quantity_lost: number;
  unit_cost_cents: number;
  total_loss_cents: number;
  shrinkage_type: string;
  detected_by: string;
  
  // Decision
  decision: string | null;
  recovery_amount_cents: number | null;
  
  // Timestamps
  event_timestamp: string;
  created_at: Generated<Date>;
  processed_at: Date | null;
}

export interface Database {
  claims: ClaimsTable;
  shrinkage_claims: ShrinkageClaimsTable;
}

// === Database Connection ===

let db: Kysely<Database> | null = null;

export function getDatabase(): Kysely<Database> {
  if (!db) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/claimsiq';
    
    db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString,
          max: 10,
        }),
      }),
    });
  }
  return db;
}

// === Schema Creation (for development) ===

export async function initializeDatabase(): Promise<void> {
  const database = getDatabase();
  
  // Create claims table
  await database.schema
    .createTable('claims')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(database.fn('gen_random_uuid')))
    .addColumn('claim_id', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('source_app', 'varchar(100)', (col) => col.notNull())
    .addColumn('claim_type', 'varchar(100)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('INTAKE'))
    .addColumn('claimant_did', 'varchar(255)', (col) => col.notNull())
    .addColumn('policy_snapshot_id', 'varchar(255)')
    .addColumn('asset_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('asset_type', 'varchar(100)')
    .addColumn('incident_type', 'varchar(100)', (col) => col.notNull())
    .addColumn('incident_severity', 'integer', (col) => col.notNull())
    .addColumn('incident_description_hash', 'varchar(64)')
    .addColumn('amount_claimed_cents', 'bigint')
    .addColumn('amount_approved_cents', 'bigint')
    .addColumn('evidence', 'jsonb', (col) => col.defaultTo('{}'))
    .addColumn('decision', 'varchar(50)')
    .addColumn('decision_confidence', 'real')
    .addColumn('decision_rationale', 'text')
    .addColumn('audit_seal', 'varchar(64)')
    .addColumn('intake_timestamp', 'timestamptz', (col) => col.notNull())
    .addColumn('decision_timestamp', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(database.fn('now')))
    .addColumn('updated_at', 'timestamptz')
    .execute();

  // Create shrinkage_claims table
  await database.schema
    .createTable('shrinkage_claims')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(database.fn('gen_random_uuid')))
    .addColumn('event_id', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('correlation_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('INTAKE'))
    .addColumn('location_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('business_name', 'varchar(255)')
    .addColumn('product_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('product_name', 'varchar(255)')
    .addColumn('quantity_lost', 'integer', (col) => col.notNull())
    .addColumn('unit_cost_cents', 'bigint', (col) => col.notNull())
    .addColumn('total_loss_cents', 'bigint', (col) => col.notNull())
    .addColumn('shrinkage_type', 'varchar(100)', (col) => col.notNull())
    .addColumn('detected_by', 'varchar(100)', (col) => col.notNull())
    .addColumn('decision', 'varchar(50)')
    .addColumn('recovery_amount_cents', 'bigint')
    .addColumn('event_timestamp', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(database.fn('now')))
    .addColumn('processed_at', 'timestamptz')
    .execute();

  // Create indexes
  await database.schema
    .createIndex('idx_claims_status')
    .ifNotExists()
    .on('claims')
    .column('status')
    .execute();

  await database.schema
    .createIndex('idx_claims_source_app')
    .ifNotExists()
    .on('claims')
    .column('source_app')
    .execute();

  await database.schema
    .createIndex('idx_shrinkage_status')
    .ifNotExists()
    .on('shrinkage_claims')
    .column('status')
    .execute();

  console.log('[DATABASE] Schema initialized');
}
