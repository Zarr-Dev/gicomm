# Gicomm

> **Discover. Trade. Grow.**

Gicomm is a digital-first marketplace for applications, e-books, games, films, courses, and creative digital assets. The storefront is designed to open directly on a product-discovery experience, while the Admin Control Center provides no-code operations for the catalog and moderation.

This repository is an early marketplace implementation, not yet a complete production commerce service. Orders, checkout, and payment processing remain intentionally deferred.

## Quick start

- No build tools required: HTML, CSS, and native JavaScript ES modules.
- Use a local web server (for example, `python -m http.server 8000`).
- Open `http://localhost:8000`.

## Project structure

```text
index.html                         Marketplace-first storefront
login.html                         Supabase email authentication
dashboard.html                     Authenticated customer dashboard
admin.html                          Admin Control Center
css/style.css                      Base component styles
css/gicomm-design-system.css       Unified responsive visual system
js/components/storage.js            Local theme preference helpers
js/components/ui.js                 Shared UI helpers
js/data/products.js                 Legacy demo dataset (not used by live storefront)
js/lib/supabase.js                  Pinned Supabase JS 2.118.0 browser client
js/lib/auth.js                      Session, profile, and Admin guards
js/pages/auth.js                    Sign-up, sign-in, and password recovery
js/pages/marketplace.js             Live catalog, category filters, wishlist
js/pages/dashboard.js               Authenticated account dashboard
js/pages/admin.js                   Product, taxonomy, moderation, and user UI
config/supabase.js                  Public project URL and publishable key
config/supabase.example.js          Safe configuration template
supabase/migrations/                Immutable applied migrations 001–007
supabase/functions/gicomm-admin/   Trusted Admin user-management function
docs/backend-implementation.md      Architecture, role bootstrap, and roadmap
```

## Storefront

- Marketplace-first layout with search and dynamic category filters.
- Public catalog reads only products with `status = 'published'`.
- Product cards read from PostgreSQL; cover images use time-limited signed URLs from the private `product-assets` bucket.
- Signed-in users can save/remove published products through `saved_products`.
- When the database has no published products, the page displays clearly labeled empty product slots rather than fake listings.
- No checkout or payment action is exposed yet.

## Admin Control Center

Open `admin.html` after signing in with an account that has trusted `app_metadata.role = 'admin'`.

Admin features implemented in the branch:
- Overview counts for products, published listings, review queue, and active categories.
- Product creation/editing, draft/publish/archive status, cover image upload, and primary digital file upload.
- Category and product-type creation and activation controls.
- Product-type/category mapping management.
- Approval/rejection of seller product revisions with a required rejection note.
- User directory and Admin/Member role controls through a server-side Edge Function.

Admin permissions are enforced twice:
1. Browser route guard checks `user.app_metadata.role`.
2. Database RLS and the `gicomm-admin` Edge Function authorize against trusted Auth `app_metadata`, never user-editable `user_metadata`.

The Edge Function prevents an Admin from changing their own role, requires confirmed email before promotion, and prevents demoting the last Admin. It returns a limited user directory and does not expose passwords or private metadata.

### Initial Admin provisioning

The first Admin must be provisioned by the project owner through the Supabase SQL Editor after the intended account has registered and confirmed its email. Replace the placeholder with the exact account email:

```sql
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE lower(email) = lower('ADMIN_EMAIL_HERE')
  AND email_confirmed_at IS NOT NULL
RETURNING id, email, raw_app_meta_data ->> 'role' AS assigned_role;
```

Run this once for the first trusted Admin only. Do not write the role to `raw_user_meta_data` or let a browser form set it. The account should sign out and sign in again after provisioning so its session receives the new claim. Further Admin promotions/demotions are available in the Admin Control Center.

## Supabase architecture

- Supabase Auth: email/password identity and sessions.
- PostgreSQL: products, profiles, taxonomy, saved products, revisions, and asset metadata.
- RLS: row-level access controls for public visitors, users, sellers, and Admins.
- Supabase Storage: private `product-assets` (10 MB) and `product-files` (500 MB) buckets.
- Supabase Edge Functions: trusted user-role management.
- Vercel: static frontend hosting.

Only the Supabase publishable key is used in browser code. Secret/service-role credentials must remain in trusted server environments and must never be committed to the repository.

## Current implementation status

| Capability | Status |
|---|---|
| Supabase email/password Auth | Implemented; live browser E2E pending |
| Authenticated dashboard guard | Implemented |
| Marketplace-first storefront | Implemented in feature branch |
| Live published product catalog | Implemented in feature branch; currently empty |
| Persistent wishlist | Implemented in feature branch |
| Admin Control Center | Implemented in feature branch |
| Admin user-role Edge Function | Deployed to Supabase; Admin account bootstrap pending |
| Product image/file upload | Implemented in Admin UI; end-to-end tests pending |
| Product revision moderation | Implemented in Admin UI; end-to-end tests pending |
| Orders, checkout, payments | Deferred |
| Malware/file-signature scanning | Not implemented; required before accepting untrusted public seller uploads |
| Production E2E and security tests | Pending |

## Migration integrity

Migrations 001–007 (including the historical 004.1 migration) are already applied and validated. They are immutable: do not edit, rename, delete, or replay them. This storefront/Admin phase adds no database migration and does not alter the existing schema.

## Roadmap

1. Finish storefront/Admin preview tests and provision the first Admin.
2. Verify catalog, wishlist, product uploads, and moderation against live RLS/Storage.
3. Add seller-facing product submission and revision flows.
4. Design persistent cart, order lifecycle, and purchase entitlements.
5. Add trusted payment integration only after order flows are stable.
6. Complete file scanning, authorization tests, observability, deployment, and rollback checks.


## Frontend redesign

The `feature/complete-frontend-redesign` branch introduces a shared design system across the storefront, authentication, account dashboard, and Admin Control Center. The redesign keeps the existing Vanilla JS/Supabase integration and page selectors intact; it does not change database schema or migrations.

See `docs/release-roadmap.md` for the stacked PR sequence and proposed future migrations. Migration proposals are not applied schema changes.
