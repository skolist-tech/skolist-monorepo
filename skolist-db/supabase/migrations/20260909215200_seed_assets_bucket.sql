--IDEMPOTENT
-- Public bucket for Python-seeded avatars and a few assessment question figures.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'seed_assets',
    'seed_assets',
    true,
    2097152,
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read seed_assets" ON storage.objects;
CREATE POLICY "Public read seed_assets"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'seed_assets');
