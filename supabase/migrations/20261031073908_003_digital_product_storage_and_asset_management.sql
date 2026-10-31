
BEGIN;

-- =========================================================
-- MIGRATION 003: DIGITAL PRODUCT STORAGE & ASSET MANAGEMENT
-- =========================================================

-- 1. Private buckets with explicit upload restrictions.
INSERT INTO storage.buckets (
    id, name, public, file_size_limit, allowed_mime_types
)
VALUES
(
    'product-assets',
    'product-assets',
    false,
    10485760,
    ARRAY['image/jpeg','image/png','image/webp','image/avif']::text[]
),
(
    'product-files',
    'product-files',
    false,
    524288000,
    ARRAY[
        'application/pdf',
        'application/epub+zip',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-7z-compressed',
        'application/octet-stream',
        'application/vnd.android.package-archive',
        'application/vnd.microsoft.portable-executable',
        'video/mp4',
        'audio/mpeg'
    ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;


-- 2. Metadata for product cover images and previews.
CREATE TABLE public.product_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL
        REFERENCES public.products(id) ON DELETE RESTRICT,
    asset_path text NOT NULL UNIQUE,
    asset_kind text NOT NULL
        CHECK (asset_kind IN ('cover', 'preview')),
    alt_text text NOT NULL DEFAULT '',
    sort_order integer NOT NULL DEFAULT 0
        CHECK (sort_order >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT product_assets_path_check
        CHECK (
            asset_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
        ),
    CONSTRAINT product_assets_alt_text_check
        CHECK (char_length(alt_text) <= 300)
);

CREATE UNIQUE INDEX product_assets_one_cover_per_product_idx
ON public.product_assets (product_id)
WHERE asset_kind = 'cover';

CREATE INDEX product_assets_product_sort_idx
ON public.product_assets (product_id, sort_order);


-- 3. Metadata for paid downloadable product files.
CREATE TABLE public.product_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL
        REFERENCES public.products(id) ON DELETE RESTRICT,
    object_path text NOT NULL UNIQUE,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes bigint NOT NULL
        CHECK (size_bytes > 0 AND size_bytes <= 524288000),
    version integer NOT NULL DEFAULT 1
        CHECK (version > 0),
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT product_files_path_check
        CHECK (
            object_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
        ),
    CONSTRAINT product_files_name_check
        CHECK (char_length(file_name) BETWEEN 1 AND 255),
    CONSTRAINT product_files_mime_check
        CHECK (char_length(mime_type) BETWEEN 3 AND 127)
);

CREATE UNIQUE INDEX product_files_one_primary_per_product_idx
ON public.product_files (product_id)
WHERE is_primary = true;

CREATE INDEX product_files_product_idx
ON public.product_files (product_id);


-- 4. Enable RLS on metadata tables.
ALTER TABLE public.product_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;


-- 5. Metadata policies: product assets.
CREATE POLICY "Product assets visibility"
ON public.product_assets
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_assets.product_id
          AND p.id::text = split_part(product_assets.asset_path, '/', 2)
          AND p.seller_id::text = split_part(product_assets.asset_path, '/', 1)
          AND (
              p.status = 'published'
              OR p.seller_id = (SELECT auth.uid())
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Product assets creation"
ON public.product_assets
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_assets.product_id
          AND p.id::text = split_part(product_assets.asset_path, '/', 2)
          AND p.seller_id::text = split_part(product_assets.asset_path, '/', 1)
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Product assets update"
ON public.product_assets
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_assets.product_id
          AND p.id::text = split_part(product_assets.asset_path, '/', 2)
          AND p.seller_id::text = split_part(product_assets.asset_path, '/', 1)
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_assets.product_id
          AND p.id::text = split_part(product_assets.asset_path, '/', 2)
          AND p.seller_id::text = split_part(product_assets.asset_path, '/', 1)
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Product assets deletion"
ON public.product_assets
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_assets.product_id
          AND p.id::text = split_part(product_assets.asset_path, '/', 2)
          AND p.seller_id::text = split_part(product_assets.asset_path, '/', 1)
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);


-- 6. Metadata policies: paid product files.
CREATE POLICY "Product files owner and admin visibility"
ON public.product_files
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_files.product_id
          AND p.id::text = split_part(product_files.object_path, '/', 2)
          AND p.seller_id::text = split_part(product_files.object_path, '/', 1)
          AND (
              p.seller_id = (SELECT auth.uid())
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Product files creation"
ON public.product_files
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_files.product_id
          AND p.id::text = split_part(product_files.object_path, '/', 2)
          AND p.seller_id::text = split_part(product_files.object_path, '/', 1)
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Product files update"
ON public.product_files
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_files.product_id
          AND p.id::text = split_part(product_files.object_path, '/', 2)
          AND p.seller_id::text = split_part(product_files.object_path, '/', 1)
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_files.product_id
          AND p.id::text = split_part(product_files.object_path, '/', 2)
          AND p.seller_id::text = split_part(product_files.object_path, '/', 1)
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Product files deletion"
ON public.product_files
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id = product_files.product_id
          AND p.id::text = split_part(product_files.object_path, '/', 2)
          AND p.seller_id::text = split_part(product_files.object_path, '/', 1)
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);


-- 7. Storage object policies: product assets.
CREATE POLICY "Product assets storage visibility"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
    bucket_id = 'product-assets'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              p.status = 'published'
              OR p.seller_id = (SELECT auth.uid())
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Product assets storage upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product-assets'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Product assets storage update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product-assets'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
)
WITH CHECK (
    bucket_id = 'product-assets'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Product assets storage deletion"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'product-assets'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);


-- 8. Storage object policies: paid product files.
CREATE POLICY "Paid product files owner visibility"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'product-files'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              p.seller_id = (SELECT auth.uid())
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Paid product files upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product-files'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Paid product files update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product-files'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
)
WITH CHECK (
    bucket_id = 'product-files'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);

CREATE POLICY "Paid product files deletion"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'product-files'
    AND EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.seller_id::text = (storage.foldername(name))[1]
          AND (
              (p.seller_id = (SELECT auth.uid()) AND p.status IN ('draft', 'rejected'))
              OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
          )
    )
);


-- 9. Explicit Data API grants. RLS remains authoritative.
GRANT SELECT ON public.product_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_assets TO authenticated;
GRANT ALL ON public.product_assets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_files TO authenticated;
GRANT ALL ON public.product_files TO service_role;

COMMIT;
