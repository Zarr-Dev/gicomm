# Gicomm Supabase migrations

This directory is the source-controlled migration history for the **Gicomm Butterfly** Supabase project.

## Applied migration sequence

The SQL files below were recovered from the live project's `supabase_migrations.schema_migrations` records and compared byte-for-byte with the corresponding repository files.

| Version | Migration | Purpose |
|---|---|---|
| `20261031062441` | `001_gicomm_marketplace_foundation` | Profiles, taxonomy, products, signup profile trigger, baseline RLS |
| `20261031073252` | `002_rls_performance_and_policy_consolidation` | Policy consolidation and query/index optimization |
| `20261031073908` | `003_digital_product_storage_and_asset_management` | Private Storage buckets, asset/file metadata, Storage RLS |
| `20261031080257` | `004_user_seller_security_hardening` | Column-level profile update grants and privilege hardening |
| `20261031081454` | `004_1_complete_default_privilege_hardening` | Default table/sequence privilege hardening for `postgres` |
| `20261031081549` | `005_existing_public_table_acl_hardening` | Existing application table ACL hardening |
| `20261031084658` | `006_wishlist_and_product_revision_workflow` | Persistent wishlist and moderated product revisions |
| `20261031094156` | `007_product_revision_foreign_key_indexes` | Covering indexes for revision foreign keys |

## Integrity rules

1. Treat migrations `001` through `007` as immutable historical records. Do not rewrite an applied migration to change schema behavior.
2. Add future schema changes as a new, timestamped migration after inspecting the live migration history.
3. Do not manually insert rows into `supabase_migrations.schema_migrations`.
4. Do not replay this history against the existing production project. Its migrations are already applied there.
5. Before applying migrations to any other environment, verify its migration history and schema first. Never reset or drop production data to make migration history appear aligned.
6. Keep secrets, service-role keys, database passwords, and production credentials out of this repository.

## Live-project caveats

- Migration `004_1` is intentionally retained with its actual applied version and name. Do not rename it for cosmetic consistency.
- The `postgres` default privileges were hardened by the recorded migrations. Default privileges owned by the internal `supabase_admin` role were not changed; do not claim that every possible object creator has identical defaults.
- Tables in `public` require explicit grants as well as RLS policies for Data API access. The wishlist and revision tables grant only the authenticated operations needed by their policies; `anon` receives no access.
- Private product downloads remain protected by the Storage policies from migration `003`. MIME metadata is not a substitute for server-side file-content validation.
- Migration files are schema history, not proof that the frontend has been integrated or that Auth, browser sessions, uploads, and downloads have passed end-to-end tests.

## Verification performed

The eight migration SQL files were fetched from the live migration history and compared with the source-controlled files. All eight matched exactly at the time this inventory was written.
