# Book Link — Design Spec

Date: 2026-08-22
Status: Approved (pending implementation plan)

## Purpose

Book Link is a bookmark manager web app. Users save links from other websites,
see a rich preview card for each link (title, description, social image), and
generate QR codes to share links or their whole collection.

## Core Decisions

| Decision | Choice |
|---|---|
| Stack | Vite + React 18 + React Router 6 |
| Motion | Framer Motion, Apple-style spring/blur motion |
| Storage | Local-first: localStorage behind a repository interface (cloud adapter can replace it later without touching UI) |
| Previews | og:title / og:description / og:image fetched once at add-time via Microlink free API, then cached in the record |
| QR | Client-side generation with the `qrcode` npm package |
| Visual style | Minimalist monochrome wireframe aesthetic: grayscale palette, white surfaces, black text/icons, generous spacing, consistent rounded corners |

## Views (mapped from the 4-panel wireframe)

1. **Dashboard** (`/`) — Panel 1. Centered pill nav/search bar; grid of saved-link
   cards in rows of 5 (2 rows visible, scrolls for more); each card is a rounded-square
   preview image with two small text pills beneath (title, domain). The third card of the
   bottom row is a prominent "+" add button.
2. **Link Detail** (`/link/:id`) — Panel 2. Same pill nav; split layout:
   large rounded-square preview left; right column has two stacked pill selectors with a
   square status indicator (black = draft, green = saved), followed by the page description.
3. **Collections** (`/collections`) — Panel 3. Massive ultra-bold uppercase category
   header centered top; horizontal row of four category cards using the same card style
   as the dashboard.
4. **Profile** (`/profile`) — Panel 4. Vertically stacked, centered: large rounded-square
   QR code upper half; below it a row of five circular action buttons (Share, Copy,
   Download PNG, Edit selection, ⋮ kebab menu).

## Data Model

```js
Link {
  id: string          // uuid
  url: string         // destination URL
  title: string
  description: string
  image: string       // og:image URL, cached permanently once fetched
  categoryId: string | null
  status: 'draft' | 'saved'   // drives the black/green dot
  createdAt: number
}

Category { id: string, name: string }
```

## Architecture

```
src/
  main.jsx              entry point
  App.jsx               router + AnimatePresence page transitions
  routes/
    Dashboard.jsx
    LinkDetail.jsx
    Collections.jsx
    Profile.jsx
  components/
    NavBar.jsx          centered rounded-pill nav/search
    LinkCard.jsx        preview square + title/domain pills
    PillSelector.jsx    pill with colored status dot
    QrCode.jsx          canvas QR renderer
    ActionCircle.jsx    circular action buttons
    AddLinkSheet.jsx    iOS-style bottom sheet for adding a URL
  storage/
    repository.js       interface: getLinks, getLink(id), addLink, updateLink, deleteLink
    localStorage.js     localStorage adapter (future: supabase.js implements same interface)
  lib/
    metadata.js         Microlink API wrapper -> {title, description, image}
    qrPayload.js        per-link + collection QR payload builders
    validate.js         URL validation
  styles/
    tokens.css          CSS custom properties (grayscale palette, radii, spacing)
    global.css
  hooks/
    useLinks.js         React hook reading/writing through repository
```

## Data Flow

1. User taps "+" card → bottom sheet opens → pastes URL → client-side validation.
   The sheet also offers an optional category dropdown (defaults seeded on first run:
   e.g. Read Later, Tools, Inspiration, Shopping).
2. `metadata.js` calls Microlink (`https://api.microlink.io/?url=...`) → returns
   title, description, image.
3. Record saved to repository with `status: 'saved'` (or `'draft'` on fetch failure);
   metadata is never re-fetched afterward.
4. New categories can be typed into the dropdown as free text; they persist alongside links.
4. Dashboard reads via `useLinks()` and re-renders.
5. Detail view reads by id; toggling status pill updates the record.
6. Profile view builds QR payloads (see below).

## QR Strategy

- **Per-link QR** encodes the real destination URL. Works everywhere, always.
- **Collection QR** encodes `<origin>/#/s/<compressed-payload>` where the payload is
  base64-encoded JSON of the most recent links (capped ~2 KB). Scanning opens a
  read-only shared view rendered entirely from the URL hash — no backend required.
  If the collection exceeds the cap, the payload truncates to the newest links and
  the UI states how many are included.
- When cloud sync is added later, collection QR switches to a short hosted URL;
  per-link QRs stay unchanged.

## Apple-Style Motion Spec

All animation runs on transform/opacity only. All motion respects
`prefers-reduced-motion` (reduced: instant state changes, no stagger).

| Moment | Effect |
|---|---|
| Tap link card | Shared-element expansion: card preview morphs into detail hero via Framer Motion `layoutId` |
| Route transitions | Old view fades/scales to 0.98 with slight blur; new view springs in; easing `cubic-bezier(0.32, 0.72, 0, 1)` |
| Grid first load | Cards stagger in: fade + 12px rise, ~40 ms apart |
| Buttons & pills | Press scale to 0.96 with spring return; soft lift shadow on hover |
| "+" add card | Gentle breathing pulse loop; opens bottom sheet with backdrop blur |
| QR reveal | Spring pop-in with subtle glow ring |
| Status toggle | Black/green dot cross-fades |

## Error Handling

- Invalid URL → inline validation in the add sheet before saving anything.
- Metadata fetch fails → retry once, then save as `draft` with favicon fallback and
  manually editable title.
- Microlink rate-limited/unreachable → same draft path; user can retry from detail view.
- localStorage unavailable/full → error toast; no silent data loss.

## Testing

Vitest + React Testing Library:

- Unit: repository CRUD round-trip against localStorage; URL validation; QR payload
  builder including truncation cap behavior.
- Component: dashboard renders N saved links plus the "+" card; detail view displays
  cached metadata with network mocked off.

## Out of Scope (Future)

- Cloud sync / accounts (Supabase adapter implementing `repository.js`)
- Editing link metadata inline beyond draft titles
- Reordering cards, drag-and-drop
