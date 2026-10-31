BEGIN;

REVOKE ALL PRIVILEGES
ON TABLE public.profiles,
         public.product_types,
         public.categories,
         public.product_type_categories,
         public.products,
         public.product_assets,
         public.product_files
FROM anon, authenticated, service_role;

-- Public clients receive read-only access to marketplace-visible data.
GRANT SELECT
ON TABLE public.profiles,
         public.product_types,
         public.categories,
         public.product_type_categories,
         public.products,
         public.product_assets
TO anon;

-- Signed-in clients: profile read access; profile edits remain column-scoped.
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (username, display_name, avatar_path, bio, website_url)
ON TABLE public.profiles TO authenticated;

-- Authenticated CRUD is still constrained by the existing RLS policies.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.product_types,
         public.categories,
         public.product_type_categories,
         public.products,
         public.product_assets,
         public.product_files
TO authenticated;

GRANT SELECT
ON TABLE public.product_types,
         public.categories,
         public.product_type_categories,
         public.products,
         public.product_assets,
         public.product_files
TO authenticated;

-- Server-side service role gets runtime CRUD, not schema-management privileges.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.profiles,
         public.product_types,
         public.categories,
         public.product_type_categories,
         public.products,
         public.product_assets,
         public.product_files
TO service_role;

COMMIT;