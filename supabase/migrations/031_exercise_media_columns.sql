-- Replace legacy asset_url with explicit media fields.
ALTER TABLE exercises
ADD COLUMN media_type text NOT NULL DEFAULT 'none'
  CHECK (media_type IN ('none', 'image', 'gif', 'video'));

ALTER TABLE exercises
ADD COLUMN media_url text DEFAULT NULL;

ALTER TABLE exercises
ADD COLUMN thumbnail_url text DEFAULT NULL;

-- Backfill from legacy asset_url where present.
UPDATE exercises
SET
  media_type = CASE
    WHEN lower(asset_url) ~ '\.gif($|\?)' THEN 'gif'
    WHEN lower(asset_url) ~ '\.(mp4|mov|webm|m3u8)($|\?)' THEN 'video'
    ELSE 'image'
  END,
  media_url = asset_url,
  thumbnail_url = CASE
    WHEN lower(asset_url) ~ '\.gif($|\?)' THEN NULL
    ELSE asset_url
  END
WHERE asset_url IS NOT NULL;

ALTER TABLE exercises
DROP COLUMN asset_url;
