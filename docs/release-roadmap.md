# Gicomm delivery roadmap

This plan is intentionally staged. PRs are stacked on the active implementation branch until the authentication foundation and marketplace work are integrated into `main`. Production deployment must not be inferred from a merged feature-branch PR.

## Pull request sequence

| PR | Scope | Exit criteria |
|---|---|---|
| #2 | Supabase Auth foundation | Browser E2E for sign-up, confirmation, sign-in, recovery, session refresh, protected dashboard, sign-out; then merge to `main` |
| #3 | Marketplace + Admin Control Center | Catalog, wishlist, Admin guard, taxonomy, moderation, upload and Edge Function checks |
| #4 | Complete frontend design system | Unified storefront, auth, account and admin visuals; responsive layouts; no JS selector/route regressions |
| #5 | Seller workspace | Seller-owned draft creation, submit-for-review, revision history, signed asset workflow; no public unscanned uploads |
| #6 | Trusted file validation | Edge Function/server-side file signature checks, malware scanning integration, quarantine and rejection path |
| #7 | Order and entitlement foundation | Transactional order creation, immutable line-item snapshots, idempotency, purchase entitlements and RLS |
| #8 | Payment provider adapter | Provider selection, webhook signature verification, idempotent payment events, reconciliation; only after order tests |
| #9 | Production hardening | RLS matrix, storage isolation, abuse controls, audit trail, observability, E2E and rollback verification |

PR #4 is based on the marketplace/admin branch and does not alter database schema. Keep the stack explicit until PR #2 is ready and merged; then retarget or rebase the stack onto `main`.

## Migration policy

Migrations 001–007 (eight historical records including 004.1) are immutable. No migration is created by the visual redesign.

Future migration candidates are proposals, not approved schema changes:

- **008 — audit events:** only if the existing schema has no adequate immutable audit log. Store actor, action, target type/id, safe metadata and timestamp. No secrets, credentials, or unrestricted client inserts. Prefer a trusted server-side write path and deny client UPDATE/DELETE.
- **009 — orders and order items:** order state machine, immutable price/currency/title snapshots, idempotency key, and transaction-safe creation. Must be designed with the payment provider and entitlement model.
- **010 — purchase entitlements:** grant/revoke records and secure download authorization, with uniqueness and replay protection.
- **011 — payment events:** only if needed by the selected provider; webhook event IDs must be unique and signature-verified before trusted writes.

Seller submission may be implementable with existing `products` and `product_revisions`; inspect live table definitions, grants, RLS policies, Storage policies, and triggers before deciding whether it needs a migration. Do not add tables just because a roadmap phase exists.

## Release gates

1. No migration is applied before SQL review, RLS design, grants, indexes, and rollback planning.
2. Every exposed table has RLS enabled and explicit grants.
3. Authorization uses trusted `app_metadata` or database ownership checks, never user-editable `user_metadata`.
4. Storage stays private; signed URLs are short-lived and issued only after authorization.
5. No real payment collection until order creation, webhook verification, idempotency, refunds/reconciliation, and support flows are tested.
6. Preview E2E must pass before production promotion.
