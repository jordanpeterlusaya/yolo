-- Add multi-image gallery + optional video to properties
-- Safe to re-run

alter table public.properties
  add column if not exists images text[] not null default '{}';

alter table public.properties
  add column if not exists video text;

-- Backfill images from single image column
update public.properties
set images = array[image]
where (images is null or cardinality(images) = 0)
  and image is not null
  and image <> '';

-- Allow larger uploads + video MIME types on storage bucket
update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/jpg',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
where id = 'properties';
