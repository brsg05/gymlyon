-- Gymlyon schema, RLS and seeds (spec §11, §13)
-- Timezone for derived day boundaries: America/Recife.

create extension if not exists "pgcrypto";

-- =====================================================================
-- profile
-- =====================================================================
create table if not exists public.profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sexo text not null check (sexo in ('m','f')),
  data_nascimento date not null,
  altura_cm int not null check (altura_cm between 100 and 250),
  peso_inicial_kg numeric not null check (peso_inicial_kg between 20 and 400),
  percentual_gordura numeric check (percentual_gordura between 3 and 70),
  objetivo text not null check (objetivo in ('emagrecer','ganhar_massa','manter')),
  nivel_atividade text not null check (nivel_atividade in ('sedentario','leve','moderado','muito','extremo')),
  tmb numeric,
  tdee numeric,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- registro_peso
-- =====================================================================
create table if not exists public.registro_peso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  peso_kg numeric not null check (peso_kg between 20 and 400),
  medido_em timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists registro_peso_user_medido_idx on public.registro_peso (user_id, medido_em desc);

-- =====================================================================
-- registro_agua
-- =====================================================================
create table if not exists public.registro_agua (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quantidade_ml int not null check (quantidade_ml between 1 and 5000),
  registrado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists registro_agua_user_reg_idx on public.registro_agua (user_id, registrado_em desc);

-- =====================================================================
-- refeicao
-- =====================================================================
create table if not exists public.refeicao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  calorias numeric check (calorias >= 0),
  peso_g numeric check (peso_g >= 0),
  proteina_g numeric check (proteina_g >= 0),
  carboidrato_g numeric check (carboidrato_g >= 0),
  gordura_g numeric check (gordura_g >= 0),
  consumido_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists refeicao_user_consumido_idx on public.refeicao (user_id, consumido_em desc);

-- =====================================================================
-- registro_sono (horas_dormidas e data_referencia derivados via trigger, D3)
-- =====================================================================
create table if not exists public.registro_sono (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  deitar_em timestamptz not null,
  acordar_em timestamptz not null,
  horas_dormidas numeric not null default 0,
  qualidade int not null check (qualidade between 1 and 5),
  data_referencia date not null,
  created_at timestamptz not null default now(),
  check (acordar_em > deitar_em)
);
create index if not exists registro_sono_user_ref_idx on public.registro_sono (user_id, data_referencia desc);

create or replace function public.sono_derive() returns trigger
language plpgsql as $$
begin
  new.horas_dormidas := extract(epoch from (new.acordar_em - new.deitar_em)) / 3600.0;
  new.data_referencia := (new.acordar_em at time zone 'America/Recife')::date;
  return new;
end;
$$;

drop trigger if exists sono_derive_trg on public.registro_sono;
create trigger sono_derive_trg
  before insert or update on public.registro_sono
  for each row execute function public.sono_derive();

-- =====================================================================
-- treino
-- =====================================================================
create table if not exists public.treino (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  inicio_em timestamptz not null,
  duracao_segundos int not null default 0 check (duracao_segundos >= 0),
  observacao text,
  created_at timestamptz not null default now()
);
create index if not exists treino_user_inicio_idx on public.treino (user_id, inicio_em desc);

-- =====================================================================
-- exercicio (catálogo, D1; user_id null = seed global)
-- =====================================================================
create table if not exists public.exercicio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  nome text not null,
  grupo_muscular text,
  created_at timestamptz not null default now()
);
create index if not exists exercicio_user_idx on public.exercicio (user_id);

-- =====================================================================
-- treino_exercicio (card, D8)
-- =====================================================================
create table if not exists public.treino_exercicio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  treino_id uuid not null references public.treino (id) on delete cascade,
  exercicio_id uuid not null references public.exercicio (id),
  peso_kg numeric not null default 0 check (peso_kg >= 0),
  series int not null check (series >= 1),
  repeticoes int not null check (repeticoes >= 1),
  descanso_segundos int check (descanso_segundos >= 0),
  observacao text,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists treino_exercicio_treino_idx on public.treino_exercicio (treino_id, ordem);
create index if not exists treino_exercicio_user_ex_idx on public.treino_exercicio (user_id, exercicio_id);

-- =====================================================================
-- meta
-- =====================================================================
create table if not exists public.meta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('peso','agua','proteina','deficit_calorico','sono')),
  valor_alvo numeric not null check (valor_alvo > 0),
  periodo text not null check (periodo in ('diario','mensal')),
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists meta_user_idx on public.meta (user_id, ativa);

-- =====================================================================
-- RLS (A4 — isolamento por usuário)
-- =====================================================================
alter table public.profile enable row level security;
alter table public.registro_peso enable row level security;
alter table public.registro_agua enable row level security;
alter table public.refeicao enable row level security;
alter table public.registro_sono enable row level security;
alter table public.treino enable row level security;
alter table public.exercicio enable row level security;
alter table public.treino_exercicio enable row level security;
alter table public.meta enable row level security;

-- Owner-only tables: select/insert/update/delete restricted to user_id = auth.uid().
do $$
declare t text;
begin
  foreach t in array array[
    'profile','registro_peso','registro_agua','refeicao',
    'registro_sono','treino','treino_exercicio','meta'
  ] loop
    execute format('create policy %1$s_select on public.%1$s for select using (user_id = auth.uid())', t);
    execute format('create policy %1$s_insert on public.%1$s for insert with check (user_id = auth.uid())', t);
    execute format('create policy %1$s_update on public.%1$s for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy %1$s_delete on public.%1$s for delete using (user_id = auth.uid())', t);
  end loop;
end $$;

-- exercicio: read global seeds + own; write only own.
create policy exercicio_select on public.exercicio
  for select using (user_id is null or user_id = auth.uid());
create policy exercicio_insert on public.exercicio
  for insert with check (user_id = auth.uid());
create policy exercicio_update on public.exercicio
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy exercicio_delete on public.exercicio
  for delete using (user_id = auth.uid());

-- =====================================================================
-- Seeds: catálogo global de exercícios (user_id null)
-- =====================================================================
insert into public.exercicio (user_id, nome, grupo_muscular) values
  (null, 'Supino reto', 'Peito'),
  (null, 'Supino inclinado', 'Peito'),
  (null, 'Crucifixo', 'Peito'),
  (null, 'Crossover', 'Peito'),
  (null, 'Puxada frontal', 'Costas'),
  (null, 'Remada curvada', 'Costas'),
  (null, 'Remada baixa', 'Costas'),
  (null, 'Barra fixa', 'Costas'),
  (null, 'Levantamento terra', 'Costas'),
  (null, 'Desenvolvimento', 'Ombros'),
  (null, 'Elevação lateral', 'Ombros'),
  (null, 'Elevação frontal', 'Ombros'),
  (null, 'Encolhimento', 'Ombros'),
  (null, 'Rosca direta', 'Bíceps'),
  (null, 'Rosca alternada', 'Bíceps'),
  (null, 'Rosca scott', 'Bíceps'),
  (null, 'Tríceps testa', 'Tríceps'),
  (null, 'Tríceps corda', 'Tríceps'),
  (null, 'Tríceps francês', 'Tríceps'),
  (null, 'Agachamento livre', 'Pernas'),
  (null, 'Leg press', 'Pernas'),
  (null, 'Cadeira extensora', 'Pernas'),
  (null, 'Cadeira flexora', 'Pernas'),
  (null, 'Stiff', 'Pernas'),
  (null, 'Panturrilha em pé', 'Pernas'),
  (null, 'Abdominal supra', 'Abdômen'),
  (null, 'Prancha', 'Abdômen'),
  (null, 'Elevação de pernas', 'Abdômen'),
  (null, 'Corrida esteira', 'Cardio'),
  (null, 'Bicicleta', 'Cardio')
on conflict do nothing;
