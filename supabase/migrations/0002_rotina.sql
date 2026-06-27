-- Gymlyon — Rotina semanal (exercícios fixos por dia) + registro por série.
-- dia_semana: 0=domingo .. 6=sábado (compatível com JS getDay()).

-- =====================================================================
-- rotina_exercicio: plano fixo de exercícios por dia da semana
-- =====================================================================
create table if not exists public.rotina_exercicio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  exercicio_id uuid not null references public.exercicio (id),
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, dia_semana, exercicio_id)
);
create index if not exists rotina_exercicio_user_dia_idx
  on public.rotina_exercicio (user_id, dia_semana, ordem);

-- =====================================================================
-- serie_registro: séries executadas (ex.: 2x8 com 16kg = 1 registro)
-- =====================================================================
create table if not exists public.serie_registro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercicio_id uuid not null references public.exercicio (id),
  dia_semana smallint not null check (dia_semana between 0 and 6),
  series int not null check (series >= 1),
  repeticoes int not null check (repeticoes >= 1),
  peso_kg numeric not null default 0 check (peso_kg >= 0),
  registrado_em timestamptz not null default now(),
  data_referencia date not null,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists serie_registro_user_ex_idx
  on public.serie_registro (user_id, exercicio_id, registrado_em desc);
create index if not exists serie_registro_user_dia_data_idx
  on public.serie_registro (user_id, dia_semana, data_referencia desc);

-- =====================================================================
-- RLS (owner-only)
-- =====================================================================
alter table public.rotina_exercicio enable row level security;
alter table public.serie_registro enable row level security;

do $$
declare t text;
begin
  foreach t in array array['rotina_exercicio','serie_registro'] loop
    execute format('create policy %1$s_select on public.%1$s for select using (user_id = auth.uid())', t);
    execute format('create policy %1$s_insert on public.%1$s for insert with check (user_id = auth.uid())', t);
    execute format('create policy %1$s_update on public.%1$s for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy %1$s_delete on public.%1$s for delete using (user_id = auth.uid())', t);
  end loop;
end $$;
