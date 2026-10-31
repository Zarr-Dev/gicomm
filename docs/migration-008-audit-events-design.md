# Migration 008 candidate — private audit events

**Status:** design proposal only. No SQL has been generated or applied.

## Why this migration is justified

The live Gicomm project currently has no audit, order, payment, or entitlement table. The Admin Control Center already performs sensitive operations: product status changes, category/type management, revision decisions, and Auth role promotion/demotion. Operational visibility and accountability need a durable event record before the platform accepts broader seller traffic.

## Proposed scope

Create an append-only audit ledger in the existing non-exposed `private` schema, not in `public`.

Candidate fields:

- `id`: generated UUID primary key.
- `actor_user_id`: nullable UUID referencing `auth.users(id)` with `ON DELETE SET NULL`; retain the event if an account is later removed.
- `action`: constrained, stable action key (for example `product.published`, `revision.approved`, `user.role_changed`).
- `target_type`: constrained entity key (for example `product`, `product_revision`, `user`, `category`, `product_type`).
- `target_id`: nullable UUID; null is allowed for system-wide or non-row operations.
- `metadata`: JSONB allowlist of non-secret context only (never passwords, tokens, signed URLs, full file contents, payment credentials, or unrestricted request bodies).
- `created_at`: server-generated timestamp.

Indexes should support chronological review and actor/action filtering without over-indexing. Retention and archival policy must be decided before production use.

## Write and read model

1. No direct `anon` or `authenticated` table grants.
2. No browser-supplied actor ID. Trusted Edge Functions derive the actor from the verified JWT; database triggers use `auth.uid()` only when the event is generated in a user transaction.
3. The table is append-only: no client UPDATE/DELETE. Any privileged maintenance path must be narrowly scoped and separately audited.
4. Admin read access should be mediated by a trusted server-side function that verifies current `app_metadata.role = 'admin'`; do not expose the private schema through the Data API.
5. Record role changes only after the Edge Function has successfully changed the role, and ensure audit failure handling does not silently report a successful mutation without a durable event.
6. Decide whether failed authorization attempts belong in this ledger or in platform logs; do not mix untrusted client-supplied details into trusted audit facts.

## Events in the first release

- Product created, submitted for review, published, rejected, archived.
- Product revision submitted, approved, rejected.
- Category/product type created, activated, deactivated, mapping changed.
- Admin role granted or revoked.

Avoid logging every profile view or ordinary catalog read.

## Security and verification gates

- Confirm `private` schema exposure and grants in the live project.
- Ensure RLS is enabled as defense in depth even though the schema is not exposed.
- Revoke default table privileges from `PUBLIC`, `anon`, and `authenticated`.
- Verify no direct Data API path can select, insert, update, or delete audit rows.
- Verify actor identity cannot be spoofed by request JSON.
- Verify Admin-only read path checks current trusted role, not stale browser UI state alone.
- Test event creation for success and failure boundaries, role changes, and concurrent operations.
- Run Supabase Security and Performance Advisors after implementation.

## Explicitly excluded

Migration 008 does not implement orders, payment records, entitlements, file scanning, or seller verification. Those require separate designs and migrations after their business rules are finalized.
