# Gymlyon

PWA mobile-first de academia e bem-estar (Next.js + Supabase). Acompanhe treinos, água,
alimentação, sono, peso e metas. Implementa a especificação em `spec_app_academia_bem_estar`.

Stack: **Next.js 16** (App Router, RSC, Server Actions) · **TypeScript** · **Tailwind v4** ·
componentes próprios estilo shadcn (Radix) · **Recharts** · **Supabase** (Postgres + Auth + RLS) · **bun**.

## Setup

1. Instale dependências:

   ```bash
   bun install
   ```

2. Crie um projeto no [Supabase](https://supabase.com) e rode a migração:

   - SQL Editor → cole e execute `supabase/migrations/0001_init.sql`
     (cria tabelas, RLS, trigger de sono e o catálogo global de exercícios).
   - Authentication → URL Configuration → adicione `http://localhost:3000/auth/callback`
     (e a URL de produção) em *Redirect URLs*.

3. Configure o ambiente:

   ```bash
   cp .env.local.example .env.local
   ```

   Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_SITE_URL`.

4. Rode em desenvolvimento:

   ```bash
   bun run dev
   ```

## Decisões da spec implementadas

- **D1** catálogo normalizado de exercícios (seeds globais + criação própria).
- **D2** treino canônico: `inicio_em` + `duracao_segundos`; cronômetro resiliente a background (A3).
- **D3** sono pertence ao dia de `acordar_em`; `horas_dormidas`/`data_referencia` derivados por trigger.
- **D4/D6** déficit estático = `TDEE − calorias do dia`; "indisponível" se alguma refeição sem calorias.
- **D5** TMB Katch-McArdle (com % gordura) ou Mifflin-St Jeor (fallback).
- **D7** `data_nascimento` armazenada; idade derivada.
- **D10** fuso `America/Recife`, locale pt-BR, vírgula decimal; fronteira do dia à meia-noite local.
- **RLS** isolamento por usuário (A4); `exercicio` permite leitura dos seeds globais.

## Estrutura

```
src/
  app/(auth)/        login, signup, magic link, reset
  app/auth/callback  troca de código/OTP por sessão
  app/onboarding     wizard TMB/TDEE + seed de metas
  app/(app)/         shell autenticado + bottom nav
    dashboard, agua, peso, alimentacao, sono, metas, mais, treinos
  components/        UI (estilo shadcn), formulários, gráficos, cronômetro
  lib/
    supabase/        clients browser/server + proxy de sessão
    domain/          time (tz), calc (TMB/TDEE/déficit), goals, constants
    actions/         server actions (wellness, goals, training, auth)
supabase/migrations/ schema + RLS + seeds
```

## Roadmap

- **MVP 1** ✅ Auth · Onboarding · Peso · Água · Refeições · Sono · Metas · Dashboard.
- **MVP 2** ✅ Treinos · Cronômetro · Catálogo · Histórico · Evolução de carga.
- **MVP 3** Sugestão automática de metas · gráficos diário/semanal/mensal.
- **MVP 4** Offline-first · exportação · backup.
