# Gicomm hybrid backend implementation

## Architecture decision

Gicomm uses a hybrid backend:

- Browser frontend: existing HTML, CSS, and native JavaScript ES modules.
- Supabase Auth: user identity, sessions, and password recovery.
- Supabase Data API: direct database operations only when table grants and RLS permit them.
- PostgreSQL: source of truth for profiles, products, taxonomy, saved products, revisions, and storage metadata.
- Supabase Storage: private product assets and downloadable files.
- Supabase Edge Functions: trusted server-side business logic when a workflow must not trust browser input.
- Vercel: static frontend hosting. No server runtime or framework is introduced in Phase 1.

The Supabase JS dependency is pinned to 2.118.0. The frontend uses the active publishable key only. A publishable key is not a secret; service-role and secret keys must never be placed in browser code, Git history, or public environment variables.

## Baseline verified before implementation

- Repository: `Zarr-Dev/gicomm`, default branch `main`.
- Frontend is native ES modules; there was no package.json or build pipeline.
- Before this phase, login was demo-only and product data came from `js/data/products.js`.
- Supabase project: `Gicomm Butterfly`, PostgreSQL 17.11, `ACTIVE_HEALTHY`.
- Eight applied migration records exist, representing migrations 001–007 (including the historical 004.1 migration).
- All application tables have RLS enabled.
- Security Advisor returned zero lints at the time of the baseline audit.
- No Edge Functions were deployed at the time of the baseline audit.

## Phase 1 — Authentication foundation

Implemented on branch `feature/hybrid-backend-phase-1-auth`:

- Pinned Supabase browser client in `js/lib/supabase.js`.
- Public project configuration in `config/supabase.js`.
- Auth/session/profile helpers in `js/lib/auth.js`.
- Email/password registration with display-name metadata.
- Email/password sign-in.
- Password reset request and password update flow.
- Dashboard session verification through `auth.getUser()`.
- Own-profile read through the `profiles` table and existing RLS.
- Sign-out through Supabase Auth.
- Demo dashboard identity and fabricated statistics replaced with authenticated identity and explicit not-yet-connected states.

### Phase 1 verification status

Code and repository structure have been inspected, but live browser end-to-end testing is still required. Do not treat this phase as production-ready until the following are verified on the deployed preview:

1. Sign-up with a new test email.
2. Email confirmation behavior (if confirmation is enabled).
3. Sign-in with valid credentials.
4. Invalid password and unknown-user error handling.
5. Password recovery redirect allow-list and update flow.
6. Session persistence after reload.
7. Dashboard redirect when signed out.
8. Sign-out and subsequent dashboard denial.
9. Profile row created by the existing Auth trigger and visible only according to existing RLS.

Supabase Auth Site URL and Redirect URLs must include the exact preview/deployment origins used for testing. OAuth buttons remain unavailable until Google/GitHub providers are configured and verified.

## Phase 2 — Catalog and taxonomy

- Read active product types, categories, and product-type/category mappings.
- Replace static product array with database-backed published products.
- Map database fields to current UI fields without changing the visual design.
- Implement search, filtering, sorting, and product detail from live data.
- Connect wishlist UI to `saved_products`.
- Test anonymous reads, authenticated reads, and owner-only wishlist operations.

No new schema migration should be added unless a concrete missing requirement is demonstrated. Migration history 001–007 is immutable.

## Phase 3 — Seller workflow and storage

- Seller product create/update using existing policies and allowed columns.
- Submit product for review using the existing product status workflow.
- Product revision submission and admin review using existing `product_revisions`.
- Upload preview assets and product files to existing private buckets.
- Use signed URLs for time-limited authorized downloads.
- Validate actual file signatures and scan files server-side before production. Browser MIME metadata is not trusted proof of file type.

## Phase 4 — Business logic

- Design persistent cart semantics.
- Add order lifecycle and purchase entitlement schema only after requirements are specified.
- Keep price and ownership validation on trusted server/database paths.
- Add idempotency and transaction boundaries for order creation.
- Payment provider integration remains explicitly deferred.

## Phase 5 — Admin and operations

- Admin moderation interface.
- Role checks based on trusted `app_metadata`, never user-editable `user_metadata`.
- Audit events for sensitive actions.
- Rate limits, abuse controls, operational logging, and failure recovery.

## Phase 6 — Production validation

- RLS tests for anon, owner, other authenticated user, seller, and admin.
- Auth lifecycle and session tests.
- Storage access tests including cross-user denial.
- API input validation and authorization tests.
- Browser end-to-end testing.
- Deployment readiness, rollback plan, and monitoring.

## Immutable migration rule

Migrations 001–007 are historical applied migrations. Never edit, rename, delete, or replay them on the existing project. Future schema changes must use a new timestamped migration after inspecting live schema, grants, RLS policies, and migration history.


## Phase 7 — Marketplace-first storefront and Admin Control Center

Implemented on branch `feature/digital-marketplace-admin-console`:

- Replaced the editorial landing page with a product-first digital marketplace layout.
- Added dynamic category navigation from `public.categories`.
- Storefront reads only `published` products from PostgreSQL and uses signed cover URLs from the private `product-assets` bucket.
- Wishlist uses the existing `saved_products` table under owner-only RLS.
- When there are no published products, the storefront renders clearly labeled empty shelf placeholders, not fabricated listings. Live database audit showed zero products at implementation time.
- Added `admin.html` and `js/pages/admin.js` with overview, product editor, taxonomy controls, revision moderation, and user role management.
- Product cover and primary file uploads use the existing private Storage buckets and metadata tables. The current UI enforces configured MIME/size allowlists, but browser MIME metadata is not proof of file content. File-signature validation and malware scanning remain required before accepting untrusted seller uploads.
- Added `requireAdmin()`, which authorizes only `user.app_metadata.role === 'admin'`.
- Added `supabase/functions/gicomm-admin/index.ts`, using pinned `@supabase/server@1.9.2`. The Edge Function is deployed as `gicomm-admin` with JWT verification enabled. It verifies the current Admin against Auth, lists a limited set of user fields, allows Admin/Member role changes, prevents self-role changes, requires confirmed email for promotion, and protects the last Admin from demotion.
- No database migration was added. Migrations 001–007 remain unchanged.

### Initial Admin provisioning

The project has no automatically assigned first Admin. After the intended account registers and confirms its email, the project owner must perform a one-time trusted provisioning action in Supabase SQL Editor by updating `auth.users.raw_app_meta_data` for the exact email. The SQL is documented in README. Subsequent role changes use the Admin Control Center. Never place the role in `raw_user_meta_data`.

### Phase 7 verification still required

- Preview browser tests for storefront, empty catalog, category filters, sign-in, wishlist, and theme.
- First Admin provisioning and admin-only route denial.
- Product create/edit/publish/archive and image/file uploads with RLS and Storage.
- Category/type/mapping CRUD and revision approval/rejection.
- Admin Edge Function user list, role promotion/demotion, self-change denial, and last-Admin protection.
- Confirm Supabase Auth Site URL/Redirect URLs for preview and production origins.
- Production file-signature validation and malware scanning before seller uploads are enabled.
