
BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text,
    display_name text NOT NULL DEFAULT '',
    avatar_path text,
    bio text,
    website_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_username_length CHECK (
        username IS NULL OR char_length(username) BETWEEN 3 AND 30
    ),
    CONSTRAINT profiles_username_format CHECK (
        username IS NULL OR username ~ '^[A-Za-z0-9_]+$'
    ),
    CONSTRAINT profiles_bio_length CHECK (
        bio IS NULL OR char_length(bio) <= 500
    )
);

CREATE UNIQUE INDEX profiles_username_lower_uidx
    ON public.profiles (lower(username))
    WHERE username IS NOT NULL;

CREATE TABLE public.product_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text NOT NULL DEFAULT '',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT product_types_name_length CHECK (char_length(name) BETWEEN 2 AND 80),
    CONSTRAINT product_types_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text NOT NULL DEFAULT '',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT categories_name_length CHECK (char_length(name) BETWEEN 2 AND 80),
    CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE public.product_type_categories (
    product_type_id uuid NOT NULL
        REFERENCES public.product_types(id) ON DELETE CASCADE,
    category_id uuid NOT NULL
        REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (product_type_id, category_id)
);

CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    product_type_id uuid NOT NULL,
    category_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL DEFAULT '',
    price numeric(12,2) NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'IDR',
    status text NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT products_type_category_fk
        FOREIGN KEY (product_type_id, category_id)
        REFERENCES public.product_type_categories(product_type_id, category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT products_title_length CHECK (char_length(title) BETWEEN 3 AND 160),
    CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT products_description_length CHECK (char_length(description) <= 10000),
    CONSTRAINT products_price_nonnegative CHECK (price >= 0),
    CONSTRAINT products_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT products_status_check CHECK (
        status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')
    )
);

CREATE UNIQUE INDEX products_slug_lower_uidx
    ON public.products (lower(slug));
CREATE INDEX products_seller_id_idx ON public.products (seller_id);
CREATE INDEX products_type_category_idx
    ON public.products (product_type_id, category_id);
CREATE INDEX products_published_listing_idx
    ON public.products (created_at DESC)
    WHERE status = 'published';
CREATE INDEX products_moderation_queue_idx
    ON public.products (created_at ASC)
    WHERE status = 'pending_review';
CREATE INDEX product_types_active_idx ON public.product_types (slug) WHERE is_active;
CREATE INDEX categories_active_idx ON public.categories (slug) WHERE is_active;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''),
            NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
            NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
            'New user'
        )
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_type_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Active product types are readable"
ON public.product_types
FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins manage product types"
ON public.product_types
FOR ALL
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Active categories are readable"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins manage categories"
ON public.categories
FOR ALL
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Product type category mappings are readable"
ON public.product_type_categories
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage product type category mappings"
ON public.product_type_categories
FOR ALL
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Published products and owner products are readable"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
    status = 'published'
    OR seller_id = (SELECT auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Sellers submit products for review"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
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
);

CREATE POLICY "Sellers update own draft or rejected products"
ON public.products
FOR UPDATE
TO authenticated
USING (
    seller_id = (SELECT auth.uid())
    AND status IN ('draft', 'rejected')
)
WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND status IN ('draft', 'pending_review')
);

CREATE POLICY "Sellers delete own draft or rejected products"
ON public.products
FOR DELETE
TO authenticated
USING (
    seller_id = (SELECT auth.uid())
    AND status IN ('draft', 'rejected')
);

CREATE POLICY "Admins manage all products"
ON public.products
FOR ALL
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE (username, display_name, avatar_path, bio, website_url)
    ON public.profiles TO authenticated;

GRANT SELECT ON public.product_types, public.categories,
    public.product_type_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_types, public.categories,
    public.product_type_categories TO authenticated;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT (seller_id, product_type_id, category_id, title, slug, description, price, currency, status)
    ON public.products TO authenticated;
GRANT UPDATE (product_type_id, category_id, title, slug, description, price, currency, status)
    ON public.products TO authenticated;
GRANT DELETE ON public.products TO authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

INSERT INTO public.product_types (name, slug, description) VALUES
    ('E-book', 'e-book', 'Digital books and written publications'),
    ('Film', 'film', 'Digital films and video content'),
    ('Application', 'application', 'Software and digital applications'),
    ('Game', 'game', 'Digital games and game-related products'),
    ('Digital Asset', 'digital-asset', 'Reusable digital files and creative assets'),
    ('Course', 'course', 'Structured digital learning materials')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, description) VALUES
    ('Design', 'design', 'Visual design and interface design'),
    ('Development', 'development', 'Software development and programming'),
    ('Productivity', 'productivity', 'Tools and resources for productive work'),
    ('3D', '3d', 'Three-dimensional models and assets'),
    ('Education', 'education', 'Learning and educational resources'),
    ('Creative', 'creative', 'Creative work and digital media'),
    ('Entertainment', 'entertainment', 'Entertainment and leisure'),
    ('Business', 'business', 'Business and professional resources'),
    ('Technology', 'technology', 'Technology-related products and resources')
ON CONFLICT (slug) DO NOTHING;

WITH mapping(type_slug, category_slug) AS (
    VALUES
        ('e-book', 'education'),
        ('e-book', 'productivity'),
        ('e-book', 'business'),
        ('e-book', 'technology'),
        ('e-book', 'creative'),
        ('film', 'entertainment'),
        ('film', 'education'),
        ('film', 'creative'),
        ('application', 'productivity'),
        ('application', 'development'),
        ('application', 'business'),
        ('application', 'technology'),
        ('application', 'creative'),
        ('game', 'entertainment'),
        ('game', 'creative'),
        ('digital-asset', 'design'),
        ('digital-asset', 'development'),
        ('digital-asset', '3d'),
        ('digital-asset', 'creative'),
        ('digital-asset', 'technology'),
        ('course', 'education'),
        ('course', 'technology'),
        ('course', 'business'),
        ('course', 'creative'),
        ('course', 'development')
)
INSERT INTO public.product_type_categories (product_type_id, category_id)
SELECT pt.id, c.id
FROM mapping
JOIN public.product_types AS pt
    ON pt.slug = mapping.type_slug
JOIN public.categories AS c
    ON c.slug = mapping.category_slug
ON CONFLICT (product_type_id, category_id) DO NOTHING;

COMMIT;
