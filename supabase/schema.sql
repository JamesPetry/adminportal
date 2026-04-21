-- Run in Supabase SQL Editor.
-- This schema powers auth + role routing + client-specific portal content.

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null check (role in ('admin', 'client')),
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_payloads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients (id) on delete cascade,
  overview jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  designs jsonb not null default '[]'::jsonb,
  invoices jsonb not null default '[]'::jsonb,
  feedback jsonb not null default '[]'::jsonb,
  files jsonb not null default '[]'::jsonb,
  project_details jsonb not null default '{}'::jsonb,
  client_actions jsonb not null default '[]'::jsonb,
  included_revisions integer not null default 2,
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.portal_payloads enable row level security;

drop policy if exists "clients_select_own_or_admin" on public.clients;
create policy "clients_select_own_or_admin"
on public.clients
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or p.client_id = clients.id)
  )
);

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "portal_payloads_select_own_or_admin" on public.portal_payloads;
create policy "portal_payloads_select_own_or_admin"
on public.portal_payloads
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or p.client_id = portal_payloads.client_id)
  )
);

drop policy if exists "portal_payloads_admin_write" on public.portal_payloads;
create policy "portal_payloads_admin_write"
on public.portal_payloads
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- Optional baseline client for Norman:
-- insert into public.clients (name, slug) values ('Strat X Advisory', 'strat-x-advisory') on conflict do nothing;
