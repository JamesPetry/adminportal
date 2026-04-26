alter table public.invoices
  add column if not exists payment_name text not null default 'JamesMarlinDesign';
alter table public.invoices
  add column if not exists payment_abn text not null default '63 611 535 706';
alter table public.invoices
  add column if not exists payment_payid text not null default '0423 624 863';
alter table public.invoices
  add column if not exists payment_reference text not null default '0019';
alter table public.invoices
  add column if not exists payment_amount numeric(12,2) not null default 2150;

notify pgrst, 'reload schema';
