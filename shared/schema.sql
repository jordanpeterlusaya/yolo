-- YOLO Rentals schema (Supabase / Postgres)
-- Run via: supabase db query --linked -f shared/schema.sql
-- or paste in SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price numeric not null check (price >= 0),
  listing_type text not null default 'rent',
  property_type text not null,
  location text not null,
  city text not null,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  area numeric not null default 0,
  image text,
  images text[] not null default '{}',
  video text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_listing_type_idx on public.properties (listing_type);
create index if not exists properties_created_at_idx on public.properties (created_at desc);

alter table public.properties enable row level security;

drop policy if exists "Public can read properties" on public.properties;
create policy "Public can read properties"
  on public.properties for select
  using (true);

drop policy if exists "Authenticated can insert properties" on public.properties;
create policy "Authenticated can insert properties"
  on public.properties for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update properties" on public.properties;
create policy "Authenticated can update properties"
  on public.properties for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete properties" on public.properties;
create policy "Authenticated can delete properties"
  on public.properties for delete
  to authenticated
  using (true);

-- Required for Data API (PostgREST)
grant usage on schema public to anon, authenticated;
grant select on table public.properties to anon, authenticated;
grant insert, update, delete on table public.properties to authenticated;

-- Storage bucket for property photos + video
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'properties',
  'properties',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read property images" on storage.objects;
create policy "Public read property images"
  on storage.objects for select
  using (bucket_id = 'properties');

drop policy if exists "Auth upload property images" on storage.objects;
create policy "Auth upload property images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'properties');

drop policy if exists "Auth update property images" on storage.objects;
create policy "Auth update property images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'properties');

drop policy if exists "Auth delete property images" on storage.objects;
create policy "Auth delete property images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'properties');

-- Admin CRM: client leads + brokers (see migrate-crm.sql for incremental deploy)
create table if not exists public.client_leads (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  phone text,
  move_date date,
  viewing_date date,
  budget numeric check (budget is null or budget >= 0),
  preferred_area text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  areas text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_leads enable row level security;
alter table public.brokers enable row level security;

drop policy if exists "Authenticated can read client_leads" on public.client_leads;
create policy "Authenticated can read client_leads"
  on public.client_leads for select to authenticated using (true);
drop policy if exists "Authenticated can insert client_leads" on public.client_leads;
create policy "Authenticated can insert client_leads"
  on public.client_leads for insert to authenticated with check (true);
drop policy if exists "Authenticated can update client_leads" on public.client_leads;
create policy "Authenticated can update client_leads"
  on public.client_leads for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated can delete client_leads" on public.client_leads;
create policy "Authenticated can delete client_leads"
  on public.client_leads for delete to authenticated using (true);

drop policy if exists "Authenticated can read brokers" on public.brokers;
create policy "Authenticated can read brokers"
  on public.brokers for select to authenticated using (true);
drop policy if exists "Authenticated can insert brokers" on public.brokers;
create policy "Authenticated can insert brokers"
  on public.brokers for insert to authenticated with check (true);
drop policy if exists "Authenticated can update brokers" on public.brokers;
create policy "Authenticated can update brokers"
  on public.brokers for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated can delete brokers" on public.brokers;
create policy "Authenticated can delete brokers"
  on public.brokers for delete to authenticated using (true);

grant select, insert, update, delete on table public.client_leads to authenticated;
grant select, insert, update, delete on table public.brokers to authenticated;
