# PR #5 — Seller Workspace

## Scope

Build the first authenticated seller workspace on top of the live schema without a database migration.

### Existing contracts verified
- `products`: seller-owned rows; sellers can create drafts and update only their own `draft` or `rejected` products. The update policy allows the seller to transition a draft/rejected product to `pending_review`.
- `product_revisions`: sellers can submit a pending revision only for their own published product. Sellers can read their own revision history; moderation updates are Admin-only.
- `product_assets`: seller cover assets can be attached only to own draft/rejected products.
- Storage bucket `product-assets`: private, 10 MiB maximum, JPEG/PNG/WebP/AVIF allowlist; object path ownership is checked against seller_id/product_id.
- Storage bucket `product-files`: private, 500 MiB maximum. It currently allows formats including executable package types; this PR deliberately does not expose digital-file uploads.

## Features
- Seller dashboard with product counts and status filters/search.
- Create and edit own draft/rejected products.
- Upload/replace cover images for draft/rejected products only.
- Submit eligible products for Admin review.
- Submit a proposed revision for already-published products.
- Read seller-owned revision history and Admin review notes.
- No direct seller publishing, archiving, deletion, payment, order, or entitlement controls.

## Security boundaries
- UI checks are convenience only; database RLS remains authoritative.
- All product reads/writes are filtered by authenticated seller identity and still rely on RLS.
- Published product changes use `product_revisions`, never direct product updates.
- Digital product file upload is intentionally disabled until PR #6 provides server-side signature validation, quarantine, and malware scanning. Browser MIME checks are not content validation.
- Storage paths use `<auth.uid()>/<product.id>/<random>-<safe-name>`; buckets remain private and preview URLs are short-lived signed URLs.
- No database migration is included. Migration history 001–007 is unchanged.

## Verification still required
- Browser E2E with a confirmed non-admin seller account.
- Verify seller A cannot read/edit seller B products or assets.
- Verify published products cannot be edited directly by a seller.
- Verify revision submission is denied for non-owned or non-published products.
- Verify Admin moderation can approve/reject and the seller sees updated status and review notes.
- Verify no digital file upload route is exposed.
