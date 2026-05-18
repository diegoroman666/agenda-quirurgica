-- ============================================================================
-- AGENDA QUIRURGICA — Supabase setup
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → paste + Run
-- Project: fcbofcpwuuaxgsgryxfo
-- ============================================================================

-- 1) Tabla principal de registros de cirugia
create table if not exists public.surgery_records (
  id            text primary key,                         -- mismo UUID local
  user_id       uuid references auth.users(id) on delete cascade not null,
  fecha         date,                                     -- duplicado para queries por fecha
  data          jsonb not null,                           -- snapshot completo del registro
  deleted       boolean not null default false,           -- soft delete (papelera)
  updated_at    timestamptz not null default now()
);

create index if not exists surgery_records_user_idx on public.surgery_records(user_id);
create index if not exists surgery_records_fecha_idx on public.surgery_records(user_id, fecha);

-- 2) RLS: cada usuario ve y modifica solo sus propios registros
alter table public.surgery_records enable row level security;

drop policy if exists "users select own records" on public.surgery_records;
create policy "users select own records"
  on public.surgery_records for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own records" on public.surgery_records;
create policy "users insert own records"
  on public.surgery_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own records" on public.surgery_records;
create policy "users update own records"
  on public.surgery_records for update
  using (auth.uid() = user_id);

drop policy if exists "users delete own records" on public.surgery_records;
create policy "users delete own records"
  on public.surgery_records for delete
  using (auth.uid() = user_id);

-- 3) Trigger para mantener updated_at fresco
create or replace function public.tg_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists surgery_records_touch on public.surgery_records;
create trigger surgery_records_touch
  before update on public.surgery_records
  for each row execute function public.tg_touch_updated_at();
