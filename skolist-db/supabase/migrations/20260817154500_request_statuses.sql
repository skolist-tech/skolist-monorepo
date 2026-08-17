-- Long-running API jobs (extract_questions first; other request_types later).

CREATE TABLE IF NOT EXISTS public.request_statuses (
    job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_type text NOT NULL,
    draft_id uuid REFERENCES public.qgen_drafts(id) ON DELETE SET NULL,
    section_id uuid REFERENCES public.qgen_draft_sections(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'success', 'failure')),
    error_message text,
    questions_extracted integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.request_statuses IS 'Tracks async backend jobs such as extract_questions.';
COMMENT ON COLUMN public.request_statuses.request_type IS 'Job kind, e.g. extract_questions.';
COMMENT ON COLUMN public.request_statuses.status IS 'processing | success | failure';

CREATE INDEX IF NOT EXISTS request_statuses_user_id_idx
    ON public.request_statuses (user_id);

CREATE INDEX IF NOT EXISTS request_statuses_section_id_idx
    ON public.request_statuses (section_id);

CREATE OR REPLACE FUNCTION public.request_statuses_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_request_statuses_set_updated_at
    BEFORE UPDATE ON public.request_statuses
    FOR EACH ROW
    EXECUTE FUNCTION public.request_statuses_set_updated_at();

ALTER TABLE public.request_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "request_statuses_owner_select"
    ON public.request_statuses
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

GRANT SELECT ON public.request_statuses TO authenticated;
GRANT ALL ON public.request_statuses TO service_role;
