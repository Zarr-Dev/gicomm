# Gicomm security baseline — 2026-11-10

This document records the security review and changes made for the Gicomm project
(**Gicomm Butterfly**, Supabase project `ozuvawktzvfhofsmqrkg`). It deliberately
does not include API keys, passwords, tokens, or other credentials.

## Verified database state

- All 9 application tables in the exposed `public` schema have Row Level Security enabled.
- The application tables are owned by `postgres`; the existing default privileges
  for objects created by `postgres` in `public` do not grant table or sequence
  privileges to `anon`, `authenticated`, or `service_role`.
- `anon` has read access only to the intended marketplace catalogue/profile
  surfaces. Its row visibility is additionally constrained by the active RLS policies.
- `authenticated` access is row-scoped by ownership or trusted
  `app_metadata.role`; profile updates are column-scoped.
- Wishlist rows are restricted to their owner. Seller product revisions can be
  submitted by the relevant seller and reviewed through Admin-only policies.
- The `product-assets` and `product-files` Storage buckets are private.
  Asset visibility is limited to published products, the owning seller, or Admin;
  paid product files are not publicly readable.
- The single-Admin database trigger is installed on `auth.users`. Its trigger
  function is `SECURITY DEFINER`, uses an empty `search_path`, and its execute
  privilege is revoked from client roles.
- Supabase Security Advisor returned no active security lint findings at the time
  of this audit. Performance Advisor reported 13 unused indexes; these are
  informational and were not removed because the project has little/no production
  query history yet.

## Changes delivered

1. `js/pages/auth.js` now resolves the optional `next` parameter through the
   browser URL parser and accepts it only when the resulting origin exactly
   matches the Gicomm origin. This blocks protocol-relative and backslash-based
   external redirects.
2. `gicomm-admin` Edge Function is deployed as version 3 with JWT verification
   still enabled. It continues to fetch the actor from Auth and check the trusted
   `app_metadata.role` on each request. It now also requires JSON, enforces a
   4 KiB request-body limit, validates actor/target UUIDs, and sends no-store and
   nosniff response headers.
3. `vercel.json` now adds baseline security headers: nosniff, clickjacking
   protection, a strict referrer policy, HSTS, and restrictive CSP directives
   for framing, object embeds, and base URLs.

## Current identity state

At audit time, `auth.users` contained 0 user accounts and 0 Admin accounts.
No administrator mailbox or Admin credentials were created. Public Signup only
creates Member accounts. The first Admin still needs to be provisioned manually
through Supabase Dashboard App Metadata, following
[`admin-auth-bootstrap.md`](./admin-auth-bootstrap.md).

## Remaining dashboard configuration

The connected project tools do not expose the current Auth provider/security
settings, so these items are not represented as already completed:

- In Supabase Authentication settings, verify email confirmation is enabled.
- Set the password minimum to at least 12 characters and enable compromised
  password protection where supported by the current plan.
- Configure short-lived email OTP/confirmation/recovery links and review Auth
  rate limits before public launch.
- Enable and require MFA for the primary Admin account once it exists.
- Set the Supabase Site URL to `https://gicomm.vercel.app` and allow only the
  exact Vercel origin and required callback paths.
- Configure a trusted SMTP provider later if branded authentication emails are
  required. A Vercel deployment domain is a website address, not an email mailbox.

The Vercel project currently has the verified default domain
`gicomm.vercel.app`; no separately purchased custom domain is attached. Vercel
also reports SSO protection enabled for non-custom-domain deployments. Confirm
the intended public/private access behavior in Vercel before sharing the app
with external users.

## Verification boundary

The database audit and Edge Function deployment were verified remotely. The
Vercel branch deployment reached `READY`. This environment could not resolve
the Vercel hostname for direct HTTP header inspection, and the Auth table is
empty, so an end-to-end login with a real Member/Admin pair has not yet been
performed. Do not treat those unperformed checks as passed.
