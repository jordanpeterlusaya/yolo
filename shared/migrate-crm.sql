-- Client leads + brokers (admin CRM)
-- Run after schema.sql: paste in Supabase SQL Editor or
-- supabase db query --linked -f shared/migrate-crm.sql

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

create index if not exists client_leads_created_at_idx on public.client_leads (created_at desc);
create index if not exists client_leads_viewing_date_idx on public.client_leads (viewing_date);

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

create index if not exists brokers_active_idx on public.brokers (active);
create index if not exists brokers_created_at_idx on public.brokers (created_at desc);

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
