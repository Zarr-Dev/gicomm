-- Add covering indexes for product revision foreign keys flagged by Performance Advisor.
CREATE INDEX IF NOT EXISTS product_revisions_reviewed_by_idx
    ON public.product_revisions (reviewed_by);

CREATE INDEX IF NOT EXISTS product_revisions_proposed_type_category_idx
    ON public.product_revisions (proposed_product_type_id, proposed_category_id);