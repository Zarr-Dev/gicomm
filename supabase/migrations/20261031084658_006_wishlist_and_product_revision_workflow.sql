-- Migration 006: persistent wishlist and moderated product revisions.
-- SECURITY INVOKER trigger: the reviewer's RLS identity is preserved.

CREATE TABLE public.saved_products (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT saved_products_pkey PRIMARY KEY (user_id, product_id)
);
CREATE INDEX saved_products_product_id_idx ON public.saved_products (product_id);
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own saved products"
ON public.saved_products FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users save published products"
ON public.saved_products FOR INSERT TO authenticated
WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = saved_products.product_id AND p.status = 'published'
    )
);

CREATE POLICY "Users remove their own saved products"
ON public.saved_products FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE TABLE public.product_revisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    proposed_product_type_id uuid NOT NULL,
    proposed_category_id uuid NOT NULL,
    proposed_title text NOT NULL,
    proposed_slug text NOT NULL,
    proposed_description text NOT NULL DEFAULT '',
    proposed_price numeric(12,2) NOT NULL,
    proposed_currency text NOT NULL DEFAULT 'IDR',
    seller_note text,
    status text NOT NULL DEFAULT 'pending_review',
    review_note text,
    reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT product_revisions_type_category_fk
        FOREIGN KEY (proposed_product_type_id, proposed_category_id)
        REFERENCES public.product_type_categories(product_type_id, category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT product_revisions_title_length CHECK (char_length(proposed_title) BETWEEN 3 AND 160),
    CONSTRAINT product_revisions_slug_format CHECK (proposed_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT product_revisions_description_length CHECK (char_length(proposed_description) <= 10000),
    CONSTRAINT product_revisions_price_nonnegative CHECK (proposed_price >= 0),
    CONSTRAINT product_revisions_currency_format CHECK (proposed_currency ~ '^[A-Z]{3}$'),
    CONSTRAINT product_revisions_seller_note_length CHECK (seller_note IS NULL OR char_length(seller_note) <= 1000),
    CONSTRAINT product_revisions_review_note_length CHECK (review_note IS NULL OR char_length(review_note) <= 2000),
    CONSTRAINT product_revisions_status_check CHECK (status IN ('pending_review', 'approved', 'rejected')),
    CONSTRAINT product_revisions_review_state_check CHECK (
        (status = 'pending_review' AND reviewed_at IS NULL)
        OR (status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX product_revisions_one_pending_per_product_uidx
ON public.product_revisions (product_id) WHERE status = 'pending_review';
CREATE INDEX product_revisions_seller_created_idx
ON public.product_revisions (seller_id, created_at DESC);
CREATE INDEX product_revisions_moderation_queue_idx
ON public.product_revisions (created_at ASC) WHERE status = 'pending_review';
CREATE INDEX product_revisions_product_id_idx
ON public.product_revisions (product_id);

ALTER TABLE public.product_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers and admins read product revisions"
ON public.product_revisions FOR SELECT TO authenticated
USING (
    seller_id = (SELECT auth.uid())
    OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Sellers submit revisions for their published products"
ON public.product_revisions FOR INSERT TO authenticated
WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND status = 'pending_review'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_revisions.product_id
          AND p.seller_id = (SELECT auth.uid())
          AND p.status = 'published'
    )
);

CREATE POLICY "Admins review product revisions"
ON public.product_revisions FOR UPDATE TO authenticated
USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION public.apply_product_revision_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE affected_rows integer;
BEGIN
    IF (SELECT auth.jwt()) -> 'app_metadata' ->> 'role' IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Only an administrator can review product revisions' USING ERRCODE = '42501';
    END IF;
    IF OLD.status <> 'pending_review' THEN
        RAISE EXCEPTION 'A product revision can only be reviewed once' USING ERRCODE = '23514';
    END IF;
    IF NEW.product_id IS DISTINCT FROM OLD.product_id
       OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
       OR NEW.proposed_product_type_id IS DISTINCT FROM OLD.proposed_product_type_id
       OR NEW.proposed_category_id IS DISTINCT FROM OLD.proposed_category_id
       OR NEW.proposed_title IS DISTINCT FROM OLD.proposed_title
       OR NEW.proposed_slug IS DISTINCT FROM OLD.proposed_slug
       OR NEW.proposed_description IS DISTINCT FROM OLD.proposed_description
       OR NEW.proposed_price IS DISTINCT FROM OLD.proposed_price
       OR NEW.proposed_currency IS DISTINCT FROM OLD.proposed_currency
       OR NEW.seller_note IS DISTINCT FROM OLD.seller_note THEN
        RAISE EXCEPTION 'Submitted revision content is immutable' USING ERRCODE = '42501';
    END IF;
    IF NEW.status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid product revision decision' USING ERRCODE = '23514';
    END IF;
    IF NEW.status = 'rejected'
       AND NULLIF(BTRIM(COALESCE(NEW.review_note, '')), '') IS NULL THEN
        RAISE EXCEPTION 'A rejection requires a review note' USING ERRCODE = '23514';
    END IF;
    IF NEW.status = 'approved' THEN
        UPDATE public.products
        SET product_type_id = OLD.proposed_product_type_id,
            category_id = OLD.proposed_category_id,
            title = OLD.proposed_title,
            slug = OLD.proposed_slug,
            description = OLD.proposed_description,
            price = OLD.proposed_price,
            currency = OLD.proposed_currency
        WHERE id = OLD.product_id
          AND seller_id = OLD.seller_id
          AND status = 'published';
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        IF affected_rows <> 1 THEN
            RAISE EXCEPTION 'The published product changed or is no longer eligible for revision'
                USING ERRCODE = '23514';
        END IF;
    END IF;
    NEW.reviewed_by := (SELECT auth.uid());
    NEW.reviewed_at := now();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_product_revision_decision()
FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER product_revision_apply_decision
BEFORE UPDATE OF status ON public.product_revisions
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.apply_product_revision_decision();

CREATE TRIGGER product_revisions_set_updated_at
BEFORE UPDATE ON public.product_revisions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL PRIVILEGES ON TABLE public.saved_products, public.product_revisions
FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.saved_products TO authenticated;
GRANT SELECT, INSERT ON TABLE public.product_revisions TO authenticated;
GRANT UPDATE (status, review_note, reviewed_by, reviewed_at)
ON TABLE public.product_revisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.saved_products, public.product_revisions TO service_role;
