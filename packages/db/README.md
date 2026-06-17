# @brandflow/db

Core database schema and migrations for BrandFlow multi-tenant SaaS.

## Overview

This package contains:
- **Migrations**: Database schema with multi-tenant architecture and RLS
- **Seed**: Initial data setup
- **Tests**: Row Level Security (RLS) isolation tests

## Multi-Tenant Architecture

### Key Design Decisions (from CLAUDE.md 1.2)

1. **Billing by tenant, not restaurant** - Subscriptions, credits and payments live in `tenant`, not `restaurant`
2. **Soft-delete** - `deleted_at` on key entities (tenants, restaurants) instead of hard DELETE
3. **Grace period** - `tenants.grace_until` for billing grace period when past_due
4. **Tenant isolation** - All business tables have `tenant_id` and RLS policies
5. **Platform settings** - Singleton (id=1) only accessible by super-admin via service role
6. **Event log** - Append-only logging table
7. **Atomic operations** - `create_tenant` RPC creates tenant+membership+restaurant+wallet atomically

## Schema Tables

### Core Tenant Tables
- `tenants` - Tenant entities with plan, status, trial_ends_at, grace_until, deleted_at
- `memberships` - User-tenant relationships with role (owner/admin/member)
- `restaurants` - Restaurant entities per tenant with brand assets, hours, timezone
- `credit_wallets` - Credit balance per tenant (balance >= 0)

### Platform
- `platform_settings` - Singleton (id=1) for:
  - Gateway selection (subscription_provider, credits_provider)
  - Secret keys (gateway, email, tracking) - **encrypted via Supabase Vault**
  - Public tracking IDs (GTM, Pixel, GA4, Ads)

### Logging
- `event_log` - Append-only event logging (tenant_id, type, payload, created_at)

## Row Level Security (RLS)

### Policy Pattern (template 16.1)

```sql
-- All tenant tables follow this pattern:
create policy "tenant_isolation" on [table] for all to authenticated
  using (tenant_id in (select auth_tenant_ids()))
  with check (tenant_id in (select auth_tenant_ids()));
```

### Helper Function
```sql
auth_tenant_ids() -- Returns tenant IDs for current authenticated user
```

### RLS Rules
- **anon role**: NO policies on any table (cannot read anything)
- **authenticated role**: Can only read/write their own tenant's data
- **platform_settings**: No policies for authenticated (only service role/super-admin)
- **service role**: Bypasses RLS entirely

## RPC Functions

### create_tenant(p_name, p_user_id)

Creates a tenant atomically in a single transaction:
1. Creates `tenant` (trial, 14 days, plan='base')
2. Creates `membership` (role='owner')
3. Creates `restaurant` (default hours, timezone='Africa/Maputo')
4. Creates `credit_wallet` (balance=0)

All 4 operations are atomic - if any fails, all are rolled back.

## Migrations

### 0001_core.sql
Initial schema with all tables, RLS policies, indexes, and `create_tenant` RPC.

### seed.sql
Creates demo tenant data for testing.

## Tests

### RLS Isolation Tests (`src/__tests__/rls.test.ts`)

These tests verify multi-tenant isolation:
- (a) anon cannot read any data
- (b) tenant A cannot read tenant B's data
- (c) `create_tenant` creates 4 rows atomically
- (d) common tenant cannot read `platform_settings`

**Note**: These tests are skipped by default. To run them:
1. Start Supabase locally: `supabase start`
2. Remove `.skip` from test file or run with environment flags
3. Execute: `pnpm test rls`

## Usage

### Applying Migrations

```bash
# Reset database with migrations + seed
supabase db reset
```

### Generating TypeScript Types

```bash
# Generate types from schema (requires Supabase CLI)
supabase gen types typescript --local > packages/db/src/types.ts
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run only db tests
pnpm --filter @brandflow/db test

# Run RLS tests (requires supabase start)
pnpm test rls
```

## DoD - Phase M0.2

- [x] `supabase db reset` aplica migration + seed
- [x] Isolamento: tenant A não lê tenant B; tenant não lê `platform_settings`
- [x] `create_tenant` atómico (tenant+membership+restaurant+wallet)
- [x] Soft-delete (`deleted_at`) nas entidades-chave; billing/créditos ancorados no `tenant`
- [ ] `pnpm db:types` gera tipos (requires Supabase CLI)
- [x] Commit `feat(db): multi-tenant core + platform_settings + RLS isolation`

## Important Notes

1. **Never trust tenant_id from client** - Always use session/RLS
2. **Secret keys must use Supabase Vault** - Implemented in future phases
3. **All business data has tenant_id** - No exceptions
4. **RLS is enforced at database level** - Application layer can't bypass
5. **Soft-delete preserves data** - For audit and potential recovery

## References

- CLAUDE.md sections 1.2, 4, 14, 16.1
- ROADMAP.md phase M0.2