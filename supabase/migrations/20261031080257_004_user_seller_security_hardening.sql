
BEGIN;

REVOKE ALL PRIVILEGES
ON TABLE public.product_files
FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.product_files
TO authenticated;

GRANT ALL PRIVILEGES
ON TABLE public.product_files
TO service_role;

ALTER DEFAULT PRIVILEGES
FOR ROLE postgres
IN SCHEMA public
REVOKE SELECT, INSERT, UPDATE, DELETE
ON TABLES
FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES
FOR ROLE postgres
IN SCHEMA public
REVOKE EXECUTE
ON FUNCTIONS
FROM PUBLIC, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES
FOR ROLE postgres
IN SCHEMA public
REVOKE USAGE, SELECT
ON SEQUENCES
FROM anon, authenticated, service_role;

REVOKE UPDATE
ON TABLE public.profiles
FROM authenticated;

GRANT UPDATE (
    username,
    display_name,
    avatar_path,
    bio,
    website_url
)
ON TABLE public.profiles
TO authenticated;

GRANT ALL PRIVILEGES
ON TABLE public.profiles,
           public.products,
           public.product_assets,
           public.product_files
TO service_role;

COMMIT;
