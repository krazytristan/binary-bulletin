-- Optional extension for Media Library automatic thumbnails and image dimensions
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS orientation text;
