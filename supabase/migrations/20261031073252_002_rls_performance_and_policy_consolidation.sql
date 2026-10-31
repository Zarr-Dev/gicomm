
BEGIN;

-- 1. Index the category-side foreign key.
CREATE INDEX IF NOT EXISTS product_type_categories_category_id_idx
ON public.product_type_categories (category_id);

-- 2. Consolidate product type policies and cache the JWT lookup per statement.
DROP POLICY IF EXISTS "Active product types are readable"
ON public.product_types;
DROP POLICY IF EXISTS "Admins manage product types"
ON public.product_types;

CREATE POLICY "Active product types are readable"
ON public.product_types
FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins insert product types"
ON public.product_types
FOR INSERT
TO authenticated
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins update product types"
ON public.product_types
FOR UPDATE
TO authenticated
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins delete product types"
ON public.product_types
FOR DELETE
TO authenticated
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

-- 3. Consolidate category policies.
DROP POLICY IF EXISTS "Active categories are readable"
ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories"
ON public.categories;

CREATE POLICY "Active categories are readable"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

-- 4. Consolidate mapping-table admin policies.
DROP POLICY IF EXISTS "Admins manage product type category mappings"
ON public.product_type_categories;

CREATE POLICY "Admins insert product type category mappings"
ON public.product_type_categories
FOR INSERT
TO authenticated
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins update product type category mappings"
ON public.product_type_categories
FOR UPDATE
TO authenticated
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins delete product type category mappings"
ON public.product_type_categories
FOR DELETE
TO authenticated
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

-- 5. Consolidate product policies while preserving seller review restrictions.
DROP POLICY IF EXISTS "Admins manage all products"
ON public.products;
DROP POLICY IF EXISTS "Published products and owner products are readable"
ON public.products;
DROP POLICY IF EXISTS "Sellers submit products for review"
ON public.products;
DROP POLICY IF EXISTS "Sellers update own draft or rejected products"
ON public.products;
DROP POLICY IF EXISTS "Sellers delete own draft or rejected products"
ON public.products;

CREATE POLICY "Products visibility"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
    status = 'published'
    OR seller_id = (SELECT auth.uid())
    OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Products creation"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR (
        seller_id = (SELECT auth.uid())
        AND status IN ('draft', 'pending_review')
        AND EXISTS (
            SELECT 1
            FROM public.product_types AS pt
            JOIN public.categories AS c
                ON c.id = public.products.category_id
            WHERE pt.id = public.products.product_type_id
              AND pt.is_active = true
              AND c.is_active = true
        )
    )
);

CREATE POLICY "Products update"
ON public.products
FOR UPDATE
TO authenticated
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR (
        seller_id = (SELECT auth.uid())
        AND status IN ('draft', 'rejected')
    )
)
WITH CHECK (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR (
        seller_id = (SELECT auth.uid())
        AND status IN ('draft', 'pending_review')
    )
);

CREATE POLICY "Products deletion"
ON public.products
FOR DELETE
TO authenticated
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR (
        seller_id = (SELECT auth.uid())
        AND status IN ('draft', 'rejected')
    )
);

COMMIT;
