/**
 * PERPLEXTA DATABASE MIGRATIONS - MODULAR & IDEMPOTENT SUITE
 * 
 * Strict Migration Order Execution Pipeline:
 *  1. CORE SCHEMA (core.schema.ts)       — Users, Auth, App Settings, Workspaces, Chat Memory
 *  2. SECURITY SCHEMA (security.schema.ts) — Audit Logs, Rate Limiting, Banned IPs, API Key Vault
 *  3. LEDGER SCHEMA (ledger.schema.ts)     — Wallets, Append-Only Financial Logs, Referrals, Credits
 *  4. MEDIA SCHEMA (media.schema.ts)       — Storage, Video Streams, Images, Assets
 *  5. EXTERNAL SCHEMA (external.schema.ts) — Integration Sync, Multi-cloud Tokens
 *  6. VERSIONED SUITE (versioned.ts)       — Idempotent DDL Alterations & System Data Seeds
 * 
 * All migrations use strict idempotent DDL constructs:
 *  - CREATE TABLE IF NOT EXISTS
 *  - ADD COLUMN IF NOT EXISTS
 *  - CREATE INDEX IF NOT EXISTS
 *  - ON CONFLICT (id) DO NOTHING / DO UPDATE
 */

export * from './migrations/index.js';
