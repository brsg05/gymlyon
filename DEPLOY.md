# Guia de Deploy — Gymlyon (Supabase + Vercel, planos grátis)

Passo a passo completo para colocar o Gymlyon no ar usando **Supabase Free** (banco + auth)
e **Vercel Hobby** (frontend Next.js). Tempo estimado: ~20–30 min.

> **Arquitetura (spec §15):** o Vercel hospeda o Next.js e as serverless functions; o estado
> (banco, auth, usuários) mora no Supabase. Não existe mais "tudo no Vercel" — essa dupla é o
> caminho free-tier padrão.

---

## Visão geral

```
[ Navegador ] → [ Vercel: Next.js (SSR + Server Actions) ] → [ Supabase: Postgres + Auth + RLS ]
```

Você vai precisar de três variáveis de ambiente em todos os lugares:

| Variável | O que é | Onde pega |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon/publishable) | Supabase → Settings → API |
| `NEXT_PUBLIC_SITE_URL` | URL pública do app | Vercel (depois do 1º deploy) |

> 🔒 A chave **anon** é pública por design — quem protege os dados é o **RLS** (já configurado na
> migração). **Nunca** use a `service_role` em variáveis `NEXT_PUBLIC_*`.

---

## Parte 1 — Supabase (banco + autenticação)

### 1.1. Criar conta e projeto

1. Acesse [supabase.com](https://supabase.com) → **Start your project** → entre com GitHub.
2. **New project**:
   - **Name:** `gymlyon`
   - **Database Password:** gere uma senha forte e **guarde** (usada só para conexões diretas; o app não precisa dela).
   - **Region:** escolha a mais próxima — **South America (São Paulo)** se disponível.
   - **Plan:** **Free**.
3. Clique em **Create new project** e aguarde ~2 min até o banco subir.

### 1.2. Rodar a migração (cria tabelas, RLS e seeds)

1. No menu lateral, abra **SQL Editor** → **New query**.
2. Abra o arquivo [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) do projeto,
   copie **todo** o conteúdo e cole no editor.
3. Clique em **Run** (ou `Ctrl+Enter`).
4. Deve aparecer **Success. No rows returned**. Isso criou:
   - as 9 tabelas (`profile`, `registro_peso`, `registro_agua`, `refeicao`, `registro_sono`, `treino`, `exercicio`, `treino_exercicio`, `meta`);
   - **RLS** em todas (isolamento por usuário);
   - o trigger que calcula horas de sono / data de referência;
   - o catálogo global de exercícios (30 itens).
5. (Opcional) Em **Table Editor**, confira que as tabelas apareceram e que `exercicio` já tem linhas.

### 1.3. Pegar as credenciais da API

1. Vá em **Settings** (engrenagem) → **API**.
2. Copie e guarde:
   - **Project URL** → vira `NEXT_PUBLIC_SUPABASE_URL`  
   - **Project API keys → `anon` `public`** (em projetos novos pode aparecer como **Publishable key**) → vira `NEXT_PUBLIC_SUPABASE_ANON_KEY` 

### 1.4. Configurar autenticação (e-mail/senha + magic link)

1. **Authentication** → **Providers** → confirme que **Email** está habilitado.
   - Para uso pessoal, mantenha **Confirm email** ligado (o app já trata a confirmação via `/auth/callback`).
   - Se quiser entrar sem confirmar e-mail durante os testes, pode desligar **Confirm email** temporariamente.
2. **Authentication** → **URL Configuration**:
   - **Site URL:** por enquanto coloque `http://localhost:3000` (vamos trocar pela URL do Vercel na Parte 4).
   - **Redirect URLs:** clique em **Add URL** e adicione:
     ```
     http://localhost:3000/**
     ```
     O app redireciona para `/auth/callback` — usar `/**` cobre isso com folga.

> ✉️ **Limite de e-mail (free):** o servidor de e-mail embutido do Supabase tem **rate limit baixo**
> (poucos e-mails/hora) e é só para desenvolvimento. Para uso real, configure um **SMTP próprio** em
> *Authentication → Emails → SMTP Settings* (ex.: Resend, Brevo — ambos têm free tier). Para uso
> pessoal de testes, o embutido resolve.

---

## Parte 2 — Rodar localmente (validação antes do deploy)

1. Na raiz do projeto:
   ```bash
   cp .env.local.example .env.local
   ```
2. Edite `.env.local` com os valores da Parte 1.3:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. Suba o app:
   ```bash
   bun install
   bun run dev
   ```
4. Abra `http://localhost:3000` → crie uma conta → confirme o e-mail → faça o onboarding.
   Se tudo funcionar, está pronto para o deploy.

---

## Parte 3 — Subir o código para o GitHub

> O Vercel faz deploy a partir de um repositório Git. (Se preferir não usar GitHub, dá para usar a
> CLI do Vercel — veja o Apêndice A.)

1. Garanta que o `.env.local` **não** vai pro Git — o `.gitignore` já ignora `.env*`
   (só o `.env.local.example` é versionado). **Nunca** comite suas chaves.
2. Faça o commit:
   ```bash
   git add -A
   git commit -m "Gymlyon: app inicial (MVP1 + MVP2)"
   ```
3. Crie um repositório vazio no GitHub (ex.: `gymlyon`) e envie:
   ```bash
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/gymlyon.git
   git push -u origin main
   ```

---

## Parte 4 — Vercel (hospedagem do Next.js)

### 4.1. Importar o projeto

1. Acesse [vercel.com](https://vercel.com) → **Sign Up** / **Log in** com a conta do GitHub.
2. **Add New… → Project** → **Import** o repositório `gymlyon`.
3. O Vercel detecta **Next.js** automaticamente. Não precisa mudar Build Command nem Output.
   - Ele também detecta o **`bun.lock`** e usa o **Bun** para instalar. (Se quiser, em
     *Settings → General → Install Command* dá para fixar `bun install`.)

### 4.2. Definir as variáveis de ambiente

Antes de clicar em Deploy, abra **Environment Variables** e adicione:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | a mesma URL da Parte 1.3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a mesma anon key da Parte 1.3 |
| `NEXT_PUBLIC_SITE_URL` | **deixe em branco por enquanto** ou ponha um placeholder; ajustamos no 4.4 |

Marque as três para os ambientes **Production, Preview e Development**.

### 4.3. Primeiro deploy

1. Clique em **Deploy** e aguarde o build (~1–2 min).
2. Ao terminar, o Vercel mostra a URL de produção, algo como:
   `https://gymlyon.vercel.app`. **Copie essa URL.**

### 4.4. Ajustar `NEXT_PUBLIC_SITE_URL` com a URL real

1. Vercel → **Settings → Environment Variables** → edite `NEXT_PUBLIC_SITE_URL` para a URL de produção:
   ```
   https://gymlyon.vercel.app
   ```
2. Vá em **Deployments** → no último deploy, **⋯ → Redeploy** (para o app pegar a variável atualizada).

---

## Parte 5 — Conectar Vercel ↔ Supabase (redirects de auth)

Sem este passo, login / magic link / reset de senha **não voltam** para o app em produção.

1. Volte ao Supabase → **Authentication → URL Configuration**:
   - **Site URL:** troque para a URL de produção: `https://gymlyon.vercel.app`
   - **Redirect URLs:** adicione (mantendo a de localhost para dev):
     ```
     https://gymlyon.vercel.app/**
     http://localhost:3000/**
     ```
2. Salve.

> Se você usar um **domínio próprio** no Vercel depois, repita: adicione `https://seudominio.com/**`
> nas Redirect URLs e atualize a Site URL + `NEXT_PUBLIC_SITE_URL`.

---

## Parte 6 — Testar em produção

1. Abra `https://gymlyon.vercel.app`.
2. **Criar conta** → confira o e-mail de confirmação → o link deve abrir o app e cair no **onboarding**.
3. Faça o onboarding (TMB/TDEE) → registre **água**, uma **refeição**, **peso** → veja o **dashboard**.
4. Teste o **cronômetro** em *Treinos*: inicie, troque de aba/minimize por uns segundos e volte —
   o tempo deve continuar correto (resiliência a background).
5. Instale como **PWA**: no Chrome/Edge mobile, menu → *Adicionar à tela inicial*.

Se algo de auth falhar, 99% das vezes é Redirect URL faltando (Parte 5) ou
`NEXT_PUBLIC_SITE_URL` desatualizada (Parte 4.4).

---

## Parte 7 — Cuidados dos planos grátis

### Supabase Free
- **Pausa por inatividade:** o projeto **pausa após ~7 dias sem uso** e precisa ser
  **reativado manualmente** no dashboard (*Restore project*). Para uso pessoal, basta restaurar quando voltar.
- **Cotas:** ~**500 MB** de Postgres e ~**50k** usuários ativos/mês — folgado para uso pessoal.
- **E-mail:** rate limit baixo no SMTP embutido (veja nota na Parte 1.4).

### Vercel Hobby
- **Uso não-comercial.** Se um dia monetizar, precisa migrar de plano.
- Cotas de execução/banda generosas para um app pessoal.
- Cada `git push` na branch `main` dispara um **deploy automático** de produção; PRs viram **previews**.

### Boas práticas
- **Nunca** comite `.env.local` nem a `service_role` key.
- Rode `bun run build` localmente antes de um push grande para pegar erros cedo.
- Backup: no free tier não há backup automático contínuo — exporte dados periodicamente se forem importantes
  (*Supabase → Database → Backups* / `pg_dump`).

---

## Apêndice A — Deploy sem GitHub (Vercel CLI)

```bash
# instalar e logar
bun add -g vercel
vercel login

# na raiz do projeto
vercel            # cria o projeto e faz um preview deploy
vercel --prod     # publica em produção
```

Defina as variáveis com:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SITE_URL
```
Depois rode `vercel --prod` de novo para aplicar.

---

## Apêndice B — Checklist rápido

- [ ] Projeto Supabase criado (Free)
- [ ] `0001_init.sql` executado com sucesso
- [ ] `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` copiados
- [ ] Auth → Email habilitado; Redirect URLs com `localhost` e domínio Vercel (`/**`)
- [ ] Testado localmente com `.env.local`
- [ ] Código no GitHub
- [ ] Projeto importado no Vercel + 3 variáveis de ambiente
- [ ] 1º deploy OK; `NEXT_PUBLIC_SITE_URL` ajustada + redeploy
- [ ] Site URL do Supabase = domínio de produção
- [ ] Fluxo de cadastro/login testado em produção
