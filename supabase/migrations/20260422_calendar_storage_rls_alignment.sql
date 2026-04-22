-- Calendar + attachment schema and RLS alignment
-- Run this against your Supabase project database.

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

notify pgrst, 'reload schema';
