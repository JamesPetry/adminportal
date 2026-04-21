# Strat X Advisory Client Portal

Production-ready, role-based client portal for:

- **Business:** Strat X Advisory
- **Primary client workspace:** Norman / Strat X Advisory Website Redesign
- **Admin workspace:** James Marlin (multi-client management)

Built with `Next.js 15` + App Router + TypeScript + Tailwind + shadcn/ui + Lucide + Framer Motion + Zustand + optional Supabase Auth/DB.

## Features

- Email/password sign-in with dual providers:
  - Local mode (zero setup)
  - Supabase mode (when env vars are present)
- Role-based routing:
  - `admin` users -> `/admin`
  - `client` users -> `/dashboard`
- Client-facing portal with clean empty states (no hardcoded demo content)
- Admin client selector and JSON/field editor for portal content
- Per-client payload storage:
  - In-memory local store for zero-config preview
  - Supabase-backed storage (`portal_payloads`) when configured
- Polished premium UI with restrained motion and responsive layout

## Routes

- `/` (role-aware redirect)
- `/sign-in`
- `/admin`
- `/admin/clients/[id]`
- `/dashboard`
- `/timeline`
- `/designs`
- `/designs/[id]`
- `/feedback`
- `/invoices`
- `/files`
- `/project-details`
- `/client-actions`

## Project Structure

- `app/(auth)` - sign-in experience
- `app/(admin)` - admin client management/editing
- `app/(portal)` - client-facing portal pages
- `components/layout` - sidebar, header, shell wrappers
- `components/shared` - reusable UI abstractions and animation wrappers
- `components/auth`, `components/feedback`, `components/client-actions` - feature modules
- `lib/supabase` - browser/server/middleware Supabase clients
- `lib/portal` - auth context + payload loading helpers
- `lib/types.ts` - typed project models
- `supabase/schema.sql` - database schema + RLS policies
- `lib/store` - lightweight Zustand state for client action completion

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   cp .env.example .env.local
   ```
3. Optional: add Supabase values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

### Local Mode (No Supabase)

If Supabase env vars are missing, the app runs automatically in local mode:

- Auth works with local cookies
- Admin sign-in: any email containing `james` or `admin`
- Client sign-in: any other email
- Portal data is editable in admin and kept in-memory while the dev server runs

## Environment Variables

Optional (required only for Supabase mode):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase Data Setup (Optional)

After running `supabase/schema.sql`, add baseline data:

1. Set the two env vars in `.env.local`.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Insert client row in `public.clients` (e.g. Strat X Advisory).
4. Insert profile rows in `public.profiles`:
   - Admin account: `role = 'admin'`, `client_id = null`
   - Norman account: `role = 'client'`, `client_id = <stratx_client_id>`
5. (Optional) Insert a `public.portal_payloads` row per client, or leave blank to use empty-state UX by default.

## Deploy to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel, create a new project and import the repo.
3. Keep defaults:
   - Framework Preset: `Next.js`
   - Build Command: `next build` (auto)
   - Output Directory: default
4. Add env vars in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**.

CLI alternative:

```bash
npm i -g vercel
vercel
vercel --prod
```
