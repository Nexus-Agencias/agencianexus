# NEXUS AGÊNCIA — Gestão Financeira & Comercial

ERP (SPA) para agências digitais: dashboard financeiro, vendas, clientes, estoque, equipe, metas, agenda, pró-labore e mais. Construído com **React 19 + TypeScript + Vite + Tailwind CSS**, com autenticação e sincronização em nuvem via **Supabase**.

Deploy: [https://nexus-agencia-gestao.vercel.app](https://nexus-agencia-gestao.vercel.app)

## Funcionalidades

- Dashboard com desempenho financeiro, meta mensal e indicadores
- Gestão de vendas, clientes, produtos, fornecedores e estoque
- Financeiro (entradas/saídas, contas, pró-labore, folha de pagamento)
- Agenda, metas, ranking comercial e notificações
- **Empresa + equipe**: dados compartilhados entre membros com login individual
- Código de empresa para convidar a equipe ao mesmo workspace
- Backup/restauração em JSON e exportação de relatórios

## Modelo de dados (Supabase)

Cada empresa é um workspace isolado. As entidades de negócio são persistidas em um
documento JSON (`company_state`) protegido por RLS, com sincronização em tempo real
entre os membros da equipe.

| Tabela            | Descrição                                              |
| ----------------- | ------------------------------------------------------ |
| `companies`       | Workspaces (nome, código da empresa, dados cadastrais) |
| `profiles`        | Usuários da equipe (nome, e-mail, cargo, avatar)       |
| `company_state`   | Documento JSON com todos os dados do negócio           |

## Configuração do Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com) (região próxima, ex. `sa-east-1`).
2. Em **Authentication → Sign In / Providers → Email**, desative *Confirm email*.
3. Em **Authentication → URL Configuration**, defina o Site URL e Redirect URLs para a URL da Vercel.
4. No **SQL Editor**, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
5. Em **Database → Realtime**, publique a tabela `company_state` (o script já tenta automaticamente).
6. Configure as variáveis de ambiente (ver abaixo) e faça o deploy.

### Variáveis de ambiente (Vercel)

| Variável               | Valor                                             |
| ---------------------- | ------------------------------------------------- |
| `VITE_SUPABASE_URL`    | Project URL (Project Settings → API)              |
| `VITE_SUPABASE_ANON_KEY` | anon public key (Project Settings → API)        |

Localmente, copie `.env.example` para `.env` e preencha os mesmos valores.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Comando            | Descrição                         |
| ------------------ | --------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento       |
| `npm run lint`     | Checagem de tipos (tsc --noEmit)  |
| `npm run build`    | Build de produção (Vite)          |
| `npm run preview`  | Pré-visualização do build         |

## Migração de dados existentes

Após configurar a nuvem e criar a primeira empresa, entre em **Perfil → Migrar dados do navegador**
para enviar os dados que já estavam no `localStorage` para a nuvem.
