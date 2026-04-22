-- Production schema for client portal platform.
-- Run in Supabase SQL editor.

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

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  name text not null,
  slug text not null unique,
  client_name text not null,
  status text not null default 'Not Started' check (status in ('Not Started', 'In Progress', 'Under Review', 'Complete')),
  completion_percent integer not null default 0 check (completion_percent >= 0 and completion_percent <= 100),
  estimated_completion_date date,
  last_updated text not null default 'Not yet updated',
  weekly_summary text not null default '',
  next_action_required text not null default '',
  archived boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  role text not null check (role in ('admin', 'client')),
  invitation_status text not null default 'invited' check (invitation_status in ('invited', 'active')),
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (project_id, email),
  unique (project_id, user_id)
);

create table if not exists public.project_portals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  timeline jsonb not null default '[]'::jsonb,
  designs jsonb not null default '[]'::jsonb,
  feedback jsonb not null default '[]'::jsonb,
  project_details jsonb not null default '{}'::jsonb,
  client_actions jsonb not null default '[]'::jsonb,
  included_revisions integer not null default 2,
  updated_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  category text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  invoice_number text not null,
  title text not null,
  issue_date date not null,
  due_date date not null,
  status text not null default 'Pending' check (status in ('Paid', 'Pending', 'Overdue', 'Upcoming')),
  currency text not null default 'AUD',
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  pdf_path text,
  created_at timestamptz not null default now(),
  unique (project_id, invoice_number)
);

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  sort_order integer not null default 0
);

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'pending_client_signature', 'pending_admin_signature', 'fully_signed')),
  content text not null default '',
  pdf_path text,
  client_sig_name text,
  client_signed_at timestamptz,
  admin_sig_name text,
  admin_signed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.project_calendar_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date,
  color_token text not null default 'custom' check (color_token in ('finance', 'timeline', 'approvals', 'custom')),
  entry_type text not null default 'note' check (entry_type in ('image', 'invoice', 'agreement', 'note', 'file')),
  invoice_id uuid references public.invoices (id) on delete set null,
  agreement_id uuid references public.agreements (id) on delete set null,
  project_file_id uuid references public.project_files (id) on delete set null,
  storage_path text,
  source_ref text,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_calendar_events add column if not exists entry_type text not null default 'note';
alter table public.project_calendar_events add column if not exists invoice_id uuid references public.invoices (id) on delete set null;
alter table public.project_calendar_events add column if not exists agreement_id uuid references public.agreements (id) on delete set null;
alter table public.project_calendar_events add column if not exists project_file_id uuid references public.project_files (id) on delete set null;
alter table public.project_calendar_events add column if not exists storage_path text;
alter table public.project_calendar_events add column if not exists source_ref text;
do $$
begin
  alter table public.project_calendar_events
    drop constraint if exists project_calendar_events_entry_type_check;
  alter table public.project_calendar_events
    add constraint project_calendar_events_entry_type_check
    check (entry_type in ('image', 'invoice', 'agreement', 'note', 'file'));
exception when undefined_table then
  null;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.has_project_access(target_project_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_admin() or exists (
    select 1
    from public.project_members m
    where m.project_id = target_project_id
      and m.invitation_status in ('invited', 'active')
      and (
        m.user_id = auth.uid()
        or lower(m.email) = lower(coalesce(auth.jwt()->>'email', ''))
      )
  );
$$;

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_portals enable row level security;
alter table public.project_files enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.agreements enable row level security;
alter table public.project_calendar_events enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "clients_read_for_accessed_projects" on public.clients;
create policy "clients_read_for_accessed_projects"
on public.clients
for select
to authenticated
using (
  public.is_admin() or exists (
    select 1
    from public.projects p
    join public.project_members m on m.project_id = p.id
    where p.client_id = clients.id
      and m.user_id = auth.uid()
      and m.invitation_status = 'active'
  )
);

drop policy if exists "projects_select_access" on public.projects;
create policy "projects_select_access"
on public.projects
for select
to authenticated
using (public.has_project_access(id));

drop policy if exists "projects_admin_write" on public.projects;
create policy "projects_admin_write"
on public.projects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "members_select_access" on public.project_members;
create policy "members_select_access"
on public.project_members
for select
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
);

drop policy if exists "members_admin_write" on public.project_members;
create policy "members_admin_write"
on public.project_members
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "portal_select_access" on public.project_portals;
create policy "portal_select_access"
on public.project_portals
for select
to authenticated
using (public.has_project_access(project_id));

drop policy if exists "portal_admin_write" on public.project_portals;
create policy "portal_admin_write"
on public.project_portals
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "files_select_access" on public.project_files;
create policy "files_select_access"
on public.project_files
for select
to authenticated
using (public.has_project_access(project_id));

drop policy if exists "files_admin_write" on public.project_files;
create policy "files_admin_write"
on public.project_files
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "files_insert_access" on public.project_files;
create policy "files_insert_access"
on public.project_files
for insert
to authenticated
with check (
  public.has_project_access(project_id)
  and (
    public.is_admin()
    or uploaded_by = auth.uid()
  )
);

drop policy if exists "files_update_delete_access" on public.project_files;
create policy "files_update_delete_access"
on public.project_files
for update
to authenticated
using (
  public.has_project_access(project_id)
  and (
    public.is_admin()
    or uploaded_by = auth.uid()
  )
)
with check (
  public.has_project_access(project_id)
  and (
    public.is_admin()
    or uploaded_by = auth.uid()
  )
);

drop policy if exists "files_delete_access" on public.project_files;
create policy "files_delete_access"
on public.project_files
for delete
to authenticated
using (
  public.has_project_access(project_id)
  and (
    public.is_admin()
    or uploaded_by = auth.uid()
  )
);

drop policy if exists "invoices_select_access" on public.invoices;
create policy "invoices_select_access"
on public.invoices
for select
to authenticated
using (public.has_project_access(project_id));

drop policy if exists "invoices_admin_write" on public.invoices;
create policy "invoices_admin_write"
on public.invoices
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "invoice_items_select_access" on public.invoice_line_items;
create policy "invoice_items_select_access"
on public.invoice_line_items
for select
to authenticated
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_line_items.invoice_id
      and public.has_project_access(i.project_id)
  )
);

drop policy if exists "invoice_items_admin_write" on public.invoice_line_items;
create policy "invoice_items_admin_write"
on public.invoice_line_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "agreements_select_access" on public.agreements;
create policy "agreements_select_access"
on public.agreements
for select
to authenticated
using (public.has_project_access(project_id));

drop policy if exists "agreements_write_access" on public.agreements;
create policy "agreements_write_access"
on public.agreements
for update
to authenticated
using (public.has_project_access(project_id))
with check (public.has_project_access(project_id));

drop policy if exists "agreements_admin_insert_delete" on public.agreements;
create policy "agreements_admin_insert_delete"
on public.agreements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "calendar_events_select_access" on public.project_calendar_events;
create policy "calendar_events_select_access"
on public.project_calendar_events
for select
to authenticated
using (public.has_project_access(project_id));

drop policy if exists "calendar_events_admin_write" on public.project_calendar_events;
create policy "calendar_events_admin_write"
on public.project_calendar_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "calendar_events_insert_access" on public.project_calendar_events;
create policy "calendar_events_insert_access"
on public.project_calendar_events
for insert
to authenticated
with check (
  public.has_project_access(project_id)
  and (
    public.is_admin()
    or (
      created_by = auth.uid()
      and entry_type in ('note', 'file', 'image')
    )
  )
);

drop policy if exists "calendar_events_update_access" on public.project_calendar_events;
create policy "calendar_events_update_access"
on public.project_calendar_events
for update
to authenticated
using (
  public.has_project_access(project_id)
  and (
    public.is_admin()
    or created_by = auth.uid()
  )
)
with check (
  public.has_project_access(project_id)
  and (
    public.is_admin()
    or (
      created_by = auth.uid()
      and entry_type in ('note', 'file', 'image')
    )
  )
);

drop policy if exists "calendar_events_delete_access" on public.project_calendar_events;
create policy "calendar_events_delete_access"
on public.project_calendar_events
for delete
to authenticated
using (
  public.has_project_access(project_id)
  and (
    public.is_admin()
    or created_by = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('generated-docs', 'generated-docs', false)
on conflict (id) do nothing;

drop policy if exists "project_files_select_objects" on storage.objects;
create policy "project_files_select_objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-files'
  and public.has_project_access(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "project_files_insert_objects" on storage.objects;
create policy "project_files_insert_objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-files'
  and public.has_project_access(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "project_files_update_objects" on storage.objects;
create policy "project_files_update_objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project-files'
  and public.has_project_access(((storage.foldername(name))[1])::uuid)
  and (public.is_admin() or owner = auth.uid())
)
with check (
  bucket_id = 'project-files'
  and public.has_project_access(((storage.foldername(name))[1])::uuid)
  and (public.is_admin() or owner = auth.uid())
);

drop policy if exists "project_files_delete_objects" on storage.objects;
create policy "project_files_delete_objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-files'
  and public.has_project_access(((storage.foldername(name))[1])::uuid)
  and (public.is_admin() or owner = auth.uid())
);

drop policy if exists "generated_docs_select_objects" on storage.objects;
create policy "generated_docs_select_objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'generated-docs'
  and public.has_project_access(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "generated_docs_insert_objects" on storage.objects;
create policy "generated_docs_insert_objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'generated-docs'
  and public.is_admin()
);

notify pgrst, 'reload schema';
