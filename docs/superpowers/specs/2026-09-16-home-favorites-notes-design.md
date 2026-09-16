# Book Link — Wave 1: Home Tabs, Favorites, Notes

Date: 2026-09-16
Status: Approved
Extends: `2026-08-22-book-link-design.md` and `2026-08-22-book-link-visual-direction.md`

## Scope

Wave 1 of the full site map focuses on the **Home** surface plus two additions to
the link record:

- **Home filter tabs** — All / Recent / Favorites above the grid.
- **Quick Save** — an inline URL bar on Home for fast saves.
- **Favorites** — a `favorite` flag on links, toggleable from cards and detail.
- **Notes** — a `notes` text field on links, captured in the add flow and
  editable inline on link detail.

Out of scope: Discover/AI, Pro tier, Project Boards, Sync Devices, browser
extension, offline reading, laptop/mobile apps.

## Approach

Incremental on the existing Dashboard route (`/`). No new top-level routes, no
nav restructure, no new dependencies. The page gains tabs, a quick-save bar, and
the data layer gains two fields.

## Data Model

Link record gains two fields:

```js
Link {
  // ...existing fields
  favorite: boolean   // default false
  notes: string       // default ''
}
```

### Storage layer

- **localStorage adapter** (`src/storage/localStorage.js`): `addLink` writes
  `favorite: false` and `notes: ''` defaults. `updateLink` already spreads
  patches — no change.
- **Supabase adapter** (`src/storage/supabase.js`): add `favorite` and `notes`
  to `linkToRow`, `rowToLink`, and the `updateLink` payload map.
- **`supabase/schema.sql`**: add `favorite boolean not null default false` and
  `notes text not null default ''` to `links`. Existing rows migrate via the
  column defaults.
- **Old localStorage records** are handled in the UI via tiny accessors
  (`favoriteOf(link) => link.favorite === true`, `notesOf(link) =>
  link.notes || ''`), so no migration script is needed.
- **`useStore`**: unchanged — `addLink`/`updateLink` already pass through
  arbitrary fields and patches.

## Home View (Dashboard)

Two additions above the existing grid, plus empty-state variants:

1. **Filter tabs** — a `seg` pill group: **All / Recent / Favorites**.
   State lives in `useSearchParams` (`?tab=recent`, `?tab=stars`) and composes
   with the existing `?cat=` filter.
   - All — existing behavior.
   - Recent — same set, sorted `createdAt` descending.
   - Favorites — only `favorite === true`, category + search still apply.
2. **Quick Save bar** — slim inline bar with a single URL field + primary Save
   button. Reuses `addLink` metadata path and validation (`isValidUrl`), inline
   error message, clears on success and toasts "Link saved". No category pick
   (that belongs to the add sheet). New card joins the grid and is shown by the
   active tab filter if it matches.
3. Existing **Add link** button and sheet remain for category pick + notes.
4. Empty states: Favorites empty → "No favorites yet — tap the ★ on a card."
   Recent never needs a distinct empty state (falls back to All's "Nothing
   saved yet").

## Card + Detail

- **LinkCard** — star toggle (`Star` / `StarFilled` Phosphor, hairlines, press
  scale) top-right of the preview tile, same treatment as the QR button; QR
  button repositions to sit alongside it. Toggle calls
  `updateLink(id, { favorite: !favorite })`.
- **LinkDetail** — star toggle beside the title, synced with the card; a
  **Notes** textarea block ("Notes" mono eyebrow) below the description. Saves on
  blur via `updateLink(id, { notes })`, toast on failure. "Add a note…"
  placeholder when empty.

## Motion & Visual Tokens

All reuse existing tokens (`ease`, `springLayout`, `springPop`,
`PRESS_SCALE_*`) from `src/lib/motion.js` and the wireframe styling in
`src/styles/global.css`. No new motion language. Reduced-motion honored via the
existing global kill-switch.

## Testing

Vitest + React Testing Library, extending existing suites:

- **storage/localStorage** — round-trip `favorite` + `notes` on add/update.
- **useStore** — `addLink` persists `notes`; `updateLink` persists a `favorite`
  patch in state.
- **Dashboard** — Favorites tab filters to starred links; Recent sorts newest
  first; quick-save bar saves on submit; Favorites empty state renders.
- **LinkCard** — star toggle dispatches update.
- **LinkDetail** — notes textarea renders saved note, saves on blur, shows
  placeholder when empty.
- Full `npm test` stays green.