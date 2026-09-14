# Supabase Backend + GitHub/Vercel Deployment Design

Date: 2026-09-14
Status: Approved

## Goal

Move Book Link's data out of the browser into a Supabase-backed backend while
keeping the current Vite/React SPA structure. Publish the repo to GitHub
(public) and configure Vercel for continuous deployment. QR share URLs should
point at the hosted site once deployed.

## Decisions (user-confirmed)

- Backend: **Supabase** (managed Postgres + REST, accessed via `@supabase/supabase-js`)
- Accounts: **single-user first** — no auth UI yet; row ownership is a fixed
  `owner` value, RLS allows anon access (documented caveat)
- Hosting: **Vercel**, auto-deploy from GitHub
- Repo: **public**

## Architecture

```
Vite SPA (repo root)                 Supabase (managed)
+----------------------+             +-------------------+
| React components     |   REST      | Postgres tables   |
|  -> useStore hook    |  ---------->|  links            |
|  -> repository.js    |  supabase-js|  categories       |
|     (adapter switch) |             |  profiles         |
+----------------------+             +-------------------+
```

- No server process to run. The SPA talks directly to Supabase's hosted REST
  API using the anon key (standard Supabase pattern).
- The storage layer keeps its current async interface so `useStore` and pages
  change minimally. Swapping the adapter is an internal detail.

### Storage adapters

- `src/storage/localStorage.js` — existing adapter (unchanged)
- `src/storage/supabase.js` — new adapter implementing the same contract
  (`getLinks`, `addLink`, `updateLink`, `deleteLink`, `getCategories`,
  `addCategory`, plus profile `getProfile`/`saveProfile`)
- `src/storage/repository.js` — switches to the Supabase adapter when
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present, otherwise
  falls back to localStorage (so local dev without cloud keys still works)

## Data model

All tables carry an `owner text not null default 'owner'` column. Indexed on
`owner`.

### links

| column       | type    | notes                              |
|--------------|---------|------------------------------------|
| id           | uuid pk | client-generated (crypto.randomUUID) |
| url          | text    |                                    |
| title        | text    | default ''                         |
| description  | text    | default ''                         |
| image        | text    | default ''                         |
| category_id  | uuid    | nullable FK -> categories          |
| status       | text    | 'draft' | 'saved', default 'draft'  |
| created_at   | bigint  | epoch ms (matches current model)   |
| owner        | text    | default 'owner'                    |

### categories

| column | type    | notes |
|--------|---------|-------|
| id     | uuid pk | client-generated |
| name   | text    | unique per owner |
| owner  | text    | default 'owner' |

### profiles

| column       | type | notes |
|--------------|------|-------|
| id           | text pk | 'me' (single profile row) |
| display_name | text | default '' |
| owner        | text | default 'owner' |

### SQL setup

`supabase/schema.sql` contains table definitions, RLS enablement, a policy
allowing anon SELECT/INSERT/UPDATE/DELETE on rows owned by `owner` for the
single-user case, and seed data matching the current localStorage defaults
(the 4 core categories and the single `profiles` row). Run once in the Supabase
SQL editor.

Security caveat: with anon access and a public repo, anyone who discovers the
project URL can read/write links. Acceptable for a personal single-user app;
revisit with authenticated users + per-user RLS policies when auth is added.

## Frontend changes

- Add `@supabase/supabase-js` dependency.
- New `src/storage/supabase.js` adapter.
- `repository.js` picks adapter based on env vars; profile read/save routed to
  the same adapter.
- `Profile` page: display name persists via the active adapter's
  `saveProfile` (no UI change; same input).
- Env files: `.env.local` (gitignored) holds real keys; `.env.example`
  committed with placeholder keys.
- QR share payloads already build URLs from `window.location.origin && pathname`
  (`collectionQrPayload`), so on Vercel they resolve to the live site with no
  code change. `linkQrPayload` encodes the raw link URL.

## Testing

- Existing Vitest suite keeps passing (storage tests still target localStorage).
- New `supabase` adapter is exercised via a mocked `@supabase/supabase-js`
  client (unit tests asserting the correct table/operation payloads, same style
  as `localStorage.test.js`).
- Manual smoke: app runs with localStorage fallback when no keys; runs against
  Supabase with keys set.

## Deployment (Vercel)

- `vercel.json` with SPA rewrites (`/*` -> `/index.html`) for the hash router.
- Vercel project configured to auto-deploy from the GitHub repo.
- Env vars set in Vercel dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## GitHub

- `.gitignore`: add `vite-*.log`, keep `node_modules`, `dist`, `.env`,
  `.env.local`.
- Commit outstanding changes, create public repo `book-link` via `gh`, push
  `master`.

## Out of scope

- User auth and per-user RLS (future)
- Server-side metadata fetching / proxying
- Backups and migrations tooling