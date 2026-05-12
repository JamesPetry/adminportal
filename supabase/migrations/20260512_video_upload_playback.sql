alter table public.project_files
  add column if not exists preview_image_path text;

alter table public.project_files
  add column if not exists duration_seconds numeric(10,2);
