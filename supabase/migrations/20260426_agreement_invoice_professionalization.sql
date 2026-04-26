alter table public.projects
  add column if not exists business_signatory_name text not null default 'James Marlin Studio';

alter table public.invoices
  add column if not exists tax_enabled boolean not null default true;
alter table public.invoices
  add column if not exists tax_rate numeric(6,4) not null default 0.10;

alter table public.agreements
  add column if not exists workflow_state text not null default 'pending_review';

do $$
begin
  alter table public.agreements
    drop constraint if exists agreements_workflow_state_check;
  alter table public.agreements
    add constraint agreements_workflow_state_check
    check (workflow_state in ('pending_review', 'actioned'));
exception when undefined_table then
  null;
end $$;

-- Rename existing Norman client/project identity to Strat X Advisory
-- and set legal/professional signatory name for agreement signatures.
update public.clients
set
  name = 'Strat X Advisory',
  slug = 'strat-x-advisory'
where lower(name) = 'norman' or lower(slug) = 'norman';

update public.projects
set
  client_name = 'Strat X Advisory',
  business_signatory_name = 'Strat X Advisory Py Ltd',
  updated_at = now()
where lower(client_name) = 'norman'
   or lower(client_name) = 'strat x advisory';

notify pgrst, 'reload schema';
