# Home Tabs, Favorites & Notes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Home filter tabs (All / Recent / Favorites), a Quick Save bar, a `favorite` flag on links, and editable `notes` on links, following the approved spec `docs/superpowers/specs/2026-09-16-home-favorites-notes-design.md`.

**Architecture:** Extends the existing Dashboard route (`/`) and the shared repository data layer. Two fields (`favorite`, `notes`) flow through both storage adapters (localStorage + Supabase) behind `repository.js`. UI adds a quick-save bar + tab pills above the existing grid, a star toggle on cards and detail, and a notes textarea in the add sheet + detail. No new routes or dependencies.

**Tech Stack:** Vite, React 18, React Router 6 (HashRouter, `useSearchParams`), Framer Motion, Vitest + React Testing Library, Phosphor icons, localStorage + Supabase adapters.

**Working directory for all commands:** `code for website`

**Test command:** `npm test -- <file>` runs vitest on one file; `npm test` runs the suite.

---

### Task 1: Supabase schema gets `favorite` and `notes`

**Files:**
- Modify: `supabase/schema.sql:16-28`

- [ ] **Step 1: Edit the `links` table**

Add two columns to the `links` table definition (`supabase/schema.sql`). Insert between the `category_id` and `status` lines:

```sql
  category_id uuid references categories (id) on delete set null,
  favorite    boolean not null default false,
  notes       text not null default '',
  status      text not null default 'draft' check (status in ('draft', 'saved')),
```

Existing rows get `favorite = false` and `notes = ''` automatically from the column defaults.

- [ ] **Step 2: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add favorite and notes columns to links schema"
```

---

### Task 2: localStorage adapter — `favorite` + `notes` defaults

**Files:**
- Modify: `src/storage/localStorage.js:44-58`
- Test: `src/storage/localStorage.test.js`

- [ ] **Step 1: Write the failing test**

Add these two tests to the `describe('links')` block in `src/storage/localStorage.test.js` (after the existing `deleteLink removes the record` test):

```js
it('addLink defaults favorite to false and notes to empty', async () => {
  const created = await addLink({ url: 'https://a.com' })
  expect(created.favorite).toBe(false)
  expect(created.notes).toBe('')
})

it('addLink stores favorite and notes when provided', async () => {
  const created = await addLink({ url: 'https://a.com', favorite: true, notes: 'hi' })
  expect(created.favorite).toBe(true)
  expect(created.notes).toBe('hi')
  expect((await getLink(created.id)).notes).toBe('hi')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/storage/localStorage.test.js`
Expected: FAIL — `addLink` returns records without `favorite`/`notes`.

- [ ] **Step 3: Implement defaults in `addLink`**

In `src/storage/localStorage.js`, inside the `addLink` record builder, add after the `categoryId` line:

```js
    favorite: data.favorite ?? false,
    notes: data.notes ?? '',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/storage/localStorage.test.js`
Expected: PASS (all localStorage tests).

- [ ] **Step 5: Commit**

```bash
git add src/storage/localStorage.js src/storage/localStorage.test.js
git commit -m "feat: localStorage adapter stores favorite and notes"
```

---

### Task 3: Supabase adapter — map `favorite` + `notes`

**Files:**
- Modify: `src/storage/supabase.js:22-43, 79-85`
- Test: `src/storage/supabase.test.js`

- [ ] **Step 1: Write the failing tests**

In `src/storage/supabase.test.js`, update the shared fixture so every existing row carries the new fields:

```js
const snakeRow = {
  id: 'a', url: 'https://x.com', title: 'T', description: '', image: '',
  category_id: null, favorite: false, notes: '', status: 'saved', created_at: 5, owner: 'owner',
}
```

Update the two assertions that reference the mapped row shape so they stay green:

```js
  it('maps link rows back to the app link shape', async () => {
    setTable('links', [{ ...snakeRow }])
    const links = await supabase.getLinks()
    expect(links[0]).toEqual({
      id: 'a', url: 'https://x.com', title: 'T', description: '', image: '',
      categoryId: null, favorite: false, notes: '', status: 'saved', createdAt: 5,
    })
  })
```

Add these two new tests:

```js
  it('writes favorite and notes in the insert row', async () => {
    setTable('links', [], { ...snakeRow })
    await supabase.addLink({ url: 'https://x.com', favorite: true, notes: 'note', categoryId: null })
    expect(calls.inserts[0].row).toMatchObject({ favorite: true, notes: 'note' })
  })

  it('maps partial favorite and notes updates to the row', async () => {
    setTable('links', [], { ...snakeRow })
    await supabase.updateLink('a', { favorite: true, notes: 'n' })
    expect(calls.updates[0].payload).toEqual({ favorite: true, notes: 'n' })
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/storage/supabase.test.js`
Expected: FAIL — rows/requests do not include `favorite`/`notes`.

- [ ] **Step 3: Implement the mapping**

In `src/storage/supabase.js`:

In `rowToLink`, after the `category_id` line:

```js
  favorite: r.favorite ?? false,
  notes: r.notes ?? '',
```

In `linkToRow`, after the `category_id` line:

```js
  favorite: l.favorite ?? false,
  notes: l.notes ?? '',
```

In `updateLink`, after the `categoryId` line in `payload`:

```js
  if (patch.favorite !== undefined) payload.favorite = patch.favorite
  if (patch.notes !== undefined) payload.notes = patch.notes
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/storage/supabase.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage/supabase.js src/storage/supabase.test.js
git commit -m "feat: supabase adapter maps favorite and notes"
```

---

### Task 4: `favoriteOf` / `notesOf` accessors

**Files:**
- Create: `src/lib/linkDefaults.js`
- Test: `src/lib/linkDefaults.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/linkDefaults.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { favoriteOf, notesOf } from './linkDefaults'

describe('linkDefaults', () => {
  it('favoriteOf defaults to false', () => {
    expect(favoriteOf({})).toBe(false)
    expect(favoriteOf({ favorite: true })).toBe(true)
    expect(favoriteOf(null)).toBe(false)
  })

  it('notesOf defaults to empty string', () => {
    expect(notesOf({})).toBe('')
    expect(notesOf({ notes: 'hi' })).toBe('hi')
    expect(notesOf(null)).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/linkDefaults.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/linkDefaults.js`:

```js
export const favoriteOf = (link) => link?.favorite === true
export const notesOf = (link) => (typeof link?.notes === 'string' ? link.notes : '')
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/linkDefaults.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/linkDefaults.js src/lib/linkDefaults.test.js
git commit -m "feat: link accessors default favorite and notes"
```

---

### Task 5: `useStore.addLink` passes `notes` through

**Files:**
- Modify: `src/hooks/useStore.jsx:30-48`
- Test: `src/hooks/useStore.test.jsx`

- [ ] **Step 1: Write the failing test**

Add to `src/hooks/useStore.test.jsx` after the `addLink falls back to draft...` test:

```js
  it('addLink passes notes through to the repository', async () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(() => result.current.addLink({ url: 'https://x.com', categoryId: null, notes: 'hi' }))
    expect(repository.addLink).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://x.com', notes: 'hi',
    }))
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/useStore.test.jsx`
Expected: FAIL — repository called without `notes`.

- [ ] **Step 3: Implement**

In `src/hooks/useStore.jsx`, in `addLink`, inside the `repository.addLink` argument object, add after the `categoryId` line:

```js
        notes: data.notes ?? '',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/hooks/useStore.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useStore.jsx src/hooks/useStore.test.jsx
git commit -m "feat: addLink forwards notes to the repository"
```

---

### Task 6: QuickSaveBar component

**Files:**
- Create: `src/components/QuickSaveBar.jsx`
- Test: `src/components/QuickSaveBar.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/QuickSaveBar.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuickSaveBar from './QuickSaveBar'

const { addLinkMock } = vi.hoisted(() => ({ addLinkMock: vi.fn() }))

vi.mock('../hooks/useStore', () => ({
  useStore: () => ({ addLink: addLinkMock }),
}))

beforeEach(() => {
  addLinkMock.mockReset().mockResolvedValue({ id: 'new' })
})

describe('QuickSaveBar', () => {
  it('shows an inline error for an invalid URL and does not save', async () => {
    render(<QuickSaveBar />)
    await userEvent.type(screen.getByRole('textbox'), 'not a url{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a valid url/i)
    expect(addLinkMock).not.toHaveBeenCalled()
  })

  it('normalizes a scheme-less URL and saves', async () => {
    render(<QuickSaveBar />)
    await userEvent.type(screen.getByRole('textbox'), 'example.com/article')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(addLinkMock).toHaveBeenCalledWith({
        url: 'https://example.com/article',
        categoryId: null,
      }),
    )
  })

  it('clears the field after a successful save', async () => {
    render(<QuickSaveBar />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'https://example.com')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/QuickSaveBar.test.jsx`
Expected: FAIL — module `QuickSaveBar` not found (or no export).

- [ ] **Step 3: Implement the component**

Create `src/components/QuickSaveBar.jsx`:

```jsx
import { useState } from 'react'
import { useStore, toast } from '../hooks/useStore'
import { normalizeUrl, isValidUrl } from '../lib/validate'

export default function QuickSaveBar() {
  const { addLink } = useStore()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValidUrl(value)) {
      setError('Enter a valid URL, e.g. example.com/article')
      return
    }
    setSaving(true)
    setError('')
    const created = await addLink({ url: normalizeUrl(value), categoryId: null })
    setSaving(false)
    if (created) {
      toast('Link saved')
      setValue('')
    } else {
      setError('Could not save — check your connection or storage.')
    }
  }

  return (
    <form className="qs-bar" onSubmit={handleSubmit} aria-label="Quick save">
      <div className="qs-row">
        <label className="sr-only" htmlFor="qs-url">Quick save URL</label>
        <input
          id="qs-url"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError('') }}
          placeholder="Paste a link to save…"
          inputMode="url"
        />
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/QuickSaveBar.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/QuickSaveBar.jsx src/components/QuickSaveBar.test.jsx
git commit -m "feat: inline quick save bar on home"
```

---

### Task 7: Home tabs + QuickSaveBar in Dashboard

**Files:**
- Modify: `src/routes/Dashboard.jsx:22-77`
- Test: `src/routes/Dashboard.test.jsx`
- Modify: `src/styles/global.css` (home actions + tabs styles)

- [ ] **Step 1: Write the failing tests**

Update `src/routes/Dashboard.test.jsx`:

1. Change the `mkLink` helper so it carries the new fields:

```js
const mkLink = (i, over = {}) => ({
  id: `l${i}`, url: `https://ex${i}.com/a`, title: `Title ${i}`,
  image: '', categoryId: null, status: 'saved', createdAt: i,
  favorite: false, notes: '', ...over,
})
```

2. Add `addLink` to the mock store state and reset it between tests:

```js
const state = { links: [], loading: false, addLink: vi.fn().mockResolvedValue({ id: 'new' }) }

vi.mock('../hooks/useStore', () => ({
  useStore: () => state,
}))

beforeEach(() => {
  state.addLink.mockReset().mockResolvedValue({ id: 'new' })
})
```

3. Add these tests to the `describe('Dashboard')` block:

```jsx
  it('filters to favorites via ?tab=stars', () => {
    state.links = [mkLink(1), mkLink(2, { favorite: true })]
    setup('/?tab=stars')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByText('Title 1')).not.toBeInTheDocument()
    expect(screen.getByText('Title 2')).toBeInTheDocument()
  })

  it('sorts newest first on ?tab=recent', () => {
    state.links = [mkLink(1), mkLink(2, { createdAt: 10 })]
    const { container } = setup('/?tab=recent')
    const titles = container.querySelectorAll('.pill-title')
    expect(titles[0].textContent).toBe('Title 2')
    expect(titles[1].textContent).toBe('Title 1')
  })

  it('shows a favorites empty state when no link is starred', () => {
    state.links = [mkLink(1)]
    setup('/?tab=stars')
    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument()
  })

  it('quick-saves a pasted URL from the bar', async () => {
    state.links = []
    setup('/')
    await userEvent.type(screen.getByRole('textbox', { name: /quick save/i }), 'example.com/a')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(state.addLink).toHaveBeenCalledWith({
        url: 'https://example.com/a',
        categoryId: null,
      }),
    )
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/routes/Dashboard.test.jsx`
Expected: FAIL — no tabs, no quick save bar, no favorites/recent behavior.

- [ ] **Step 3: Implement the Dashboard**

Replace the body of the `Dashboard` function in `src/routes/Dashboard.jsx` (keep the `SkeletonCard` component and imports, add `useSearchParams` destructuring for `setParams`, add `QuickSaveBar` and `favoriteOf` imports):

```jsx
export default function Dashboard() {
  const { links, loading } = useStore()
  const { query } = useSearch()
  const [params, setParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const catId = params.get('cat')
  const tab = params.get('tab') === 'recent' || params.get('tab') === 'stars' ? params.get('tab') : null
  const q = query.trim().toLowerCase()
  const base = links.filter((l) => {
    if (catId && l.categoryId !== catId) return false
    if (!q) return true
    return `${l.title} ${l.url}`.toLowerCase().includes(q)
  })
  const visible = tab === 'recent'
    ? [...base].sort((a, b) => b.createdAt - a.createdAt)
    : tab === 'stars'
      ? base.filter((l) => favoriteOf(l))
      : base

  function setTab(next) {
    const nextParams = new URLSearchParams(params)
    if (next) nextParams.set('tab', next)
    else nextParams.delete('tab')
    setParams(nextParams, { replace: true })
  }

  const showNothingSaved = !loading && links.length === 0 && tab !== 'stars'
  const showNoMatches = !loading && links.length > 0 && visible.length === 0 && tab !== 'stars'
  const showNoFavorites = !loading && tab === 'stars' && visible.length === 0

  return (
    <section aria-label="Saved links">
      <div className="page-head">
        <div>
          <p className="mono eyebrow">Your shelf</p>
          <h1 className="page-title">Saved links</h1>
          <p className="mono" style={{ marginTop: 10 }}>
            {links.length} {links.length === 1 ? 'link' : 'links'} saved
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setSheetOpen(true)}>
          <Plus size={16} weight="bold" /> Add link
        </button>
      </div>

      <div className="home-actions">
        <QuickSaveBar />
        <div className="seg home-tabs" role="group" aria-label="Filter saved links">
          <button type="button" aria-pressed={tab === null} onClick={() => setTab(null)}>
            All
          </button>
          <button type="button" aria-pressed={tab === 'recent'} onClick={() => setTab('recent')}>
            Recent
          </button>
          <button type="button" aria-pressed={tab === 'stars'} onClick={() => setTab('stars')}>
            Favorites
          </button>
        </div>
      </div>

      {showNothingSaved && (
        <div className="empty-state">
          <span className="empty-icon">
            <BookmarkSimple size={26} weight="light" aria-hidden="true" />
          </span>
          <h2>Nothing saved yet.</h2>
          <p className="mono">Add your first link to build a shelf</p>
        </div>
      )}
      {showNoMatches && (
        <div className="empty-state">
          <h2>No links match "{q}".</h2>
          <p className="mono">Try a different search</p>
        </div>
      )}
      {showNoFavorites && (
        <div className="empty-state">
          <span className="empty-icon">
            <Star size={26} weight="light" aria-hidden="true" />
          </span>
          <h2>No favorites yet.</h2>
          <p className="mono">Tap the ★ on a card to pin it here</p>
        </div>
      )}
      <div className="grid">
        {loading &&
          Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
        {!loading &&
          visible.map((link, i) => (
            <LinkCard key={link.id} link={link} index={i} />
          ))}
      </div>
      <AddLinkSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  )
}
```

Update the imports line in `src/routes/Dashboard.jsx` to:

```jsx
import { Star } from '@phosphor-icons/react'
import { BookmarkSimple, Plus } from '@phosphor-icons/react'
import { useStore } from '../hooks/useStore'
import { useSearch } from '../lib/search'
import { favoriteOf } from '../lib/linkDefaults'
import LinkCard from '../components/LinkCard'
import AddLinkSheet from '../components/AddLinkSheet'
import QuickSaveBar from '../components/QuickSaveBar'
```

- [ ] **Step 4: Add the Home styles**

In `src/styles/global.css`, after the `.page-head` block (around line 104), add:

```css
/* Home actions (quick save + tabs) */
.home-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding-left: 32px;
  margin-bottom: 28px;
}
.qs-bar { display: flex; flex-direction: column; gap: 8px; max-width: 640px; width: 100%; }
.qs-row { display: flex; gap: 10px; }
.qs-row input {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  padding: 12px 18px;
  outline: none;
}
.qs-row input:focus { border-color: var(--line-strong); }
```

- [ ] **Step 5: Run all Dashboard + QuickSaveBar tests**

Run: `npm test -- src/routes/Dashboard.test.jsx src/components/QuickSaveBar.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/routes/Dashboard.jsx src/routes/Dashboard.test.jsx src/styles/global.css
git commit -m "feat: home filter tabs and quick save bar"
```

---

### Task 8: Star toggle on LinkCard

**Files:**
- Modify: `src/components/LinkCard.jsx:9-51`
- Test: `src/components/LinkCard.test.jsx`
- Modify: `src/styles/global.css` (card-fav styles)

- [ ] **Step 1: Write the failing tests**

In `src/components/LinkCard.test.jsx`, add a hoisted mock for `useStore` at the top and wire it into the component test setup:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LinkCard from './LinkCard'

const { updateLinkMock } = vi.hoisted(() => ({ updateLinkMock: vi.fn() }))

vi.mock('../hooks/useStore', () => ({
  useStore: () => ({ updateLink: updateLinkMock }),
}))
```

(The `link` fixture stays as-is.) Add these tests inside `describe('LinkCard')`:

```jsx
  it('renders a favorite toggle with the pending state', () => {
    setup()
    const star = screen.getByRole('button', { name: /favorite/i })
    expect(star).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggles favorite through updateLink', async () => {
    updateLinkMock.mockResolvedValue({ id: 'l1', favorite: true })
    setup()
    await userEvent.click(screen.getByRole('button', { name: /favorite/i }))
    expect(updateLinkMock).toHaveBeenCalledWith('l1', { favorite: true })
  })

  it('renders the star filled when the link is a favorite', () => {
    setup({ favorite: true })
    expect(screen.getByRole('button', { name: /favorite/i })).toHaveAttribute('aria-pressed', 'true')
  })
```

Reset the mock before each test:

```jsx
beforeEach(() => updateLinkMock.mockReset().mockResolvedValue({ id: 'l1', favorite: true }))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/LinkCard.test.jsx`
Expected: FAIL (also possibly on existing tests) — no star button rendered, `useStore` not provided.

- [ ] **Step 3: Implement the toggle**

In `src/components/LinkCard.jsx`:

Update imports:

```jsx
import { Star, StarFilled, QrCode as QrCodeIcon } from '@phosphor-icons/react'
import { useStore } from '../hooks/useStore'
import { favoriteOf } from '../lib/linkDefaults'
```

Update the component body — pull `updateLink` from the store and render the star over the preview tile, relocating the QR button to the left:

```jsx
export default function LinkCard({ link, index = 0 }) {
  const { updateLink } = useStore()
  const [qrOpen, setQrOpen] = useState(false)
  const domain = domainOf(link.url)
  const favorite = favoriteOf(link)
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease, delay: index * 0.04 }}
      >
        <div className="link-tile">
          <motion.button
            type="button"
            className={`card-fav${favorite ? ' is-fav' : ''}`}
            aria-label="Favorite"
            aria-pressed={favorite}
            onClick={() => updateLink(link.id, { favorite: !favorite })}
            whileTap={{ scale: 0.9 }}
          >
            {favorite ? (
              <StarFilled size={15} weight="fill" aria-hidden="true" />
            ) : (
              <Star size={15} weight="bold" aria-hidden="true" />
            )}
          </motion.button>
          <Link
            to={`/link/${link.id}`}
            className="link-card card-hover"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <motion.span layoutId={`preview-${link.id}`} transition={springLayout} className="card-preview">
              {link.image ? (
                <img src={link.image} alt="" loading="lazy" />
              ) : (
                <span className="letter-tile">{domain.charAt(0).toUpperCase()}</span>
              )}
            </motion.span>
            <span className="card-pills">
              <span className="pill-title">{link.title}</span>
              <span className="pill-domain mono">{domain}</span>
            </span>
          </Link>
          <motion.button
            type="button"
            className="card-qr"
            aria-label={`QR code for ${link.title || domain}`}
            onClick={() => setQrOpen(true)}
            whileTap={{ scale: 0.9 }}
          >
            <QrCodeIcon size={15} weight="bold" aria-hidden="true" />
          </motion.button>
        </div>
      </motion.div>
      <LinkQrSheet link={qrOpen ? link : null} onClose={() => setQrOpen(false)} />
    </>
  )
}
```

- [ ] **Step 4: Add the card-fav styles**

In `src/styles/global.css`, replace the existing `.card-qr` block (lines 128-137) with grouped selectors:

```css
.card-fav, .card-qr {
  position: absolute; top: 10px; z-index: 2;
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--surface); border: 1px solid var(--line);
  color: var(--ink-3);
  display: grid; place-items: center;
  transition: transform 120ms cubic-bezier(0.32, 0.72, 0, 1), color 120ms, border-color 120ms, background 120ms;
}
.card-fav { right: 10px; }
.card-qr { right: 52px; }
.card-fav:hover, .card-qr:hover { color: var(--accent); border-color: var(--line-strong); background: var(--bg); }
.card-fav:active, .card-qr:active { transform: scale(0.92); }
.card-fav.is-fav { color: var(--accent); border-color: var(--line-strong); background: var(--bg); }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/components/LinkCard.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/LinkCard.jsx src/components/LinkCard.test.jsx src/styles/global.css
git commit -m "feat: favorite toggle on link cards"
```

---

### Task 9: Favorite + notes on LinkDetail

**Files:**
- Modify: `src/routes/LinkDetail.jsx:63-124`
- Test: `src/routes/LinkDetail.test.jsx`

- [ ] **Step 1: Write the failing tests**

In `src/routes/LinkDetail.test.jsx`, add a note to the fixture `link` and reset state:

```js
const link = {
  id: 'l1', url: 'https://example.com/post', title: 'Cached Title',
  description: 'Some description.', image: 'https://img/x.png',
  categoryId: 'tools', status: 'saved', createdAt: 1700000000000,
  favorite: false, notes: '',
}
```

Add these tests to `describe('LinkDetail')`:

```jsx
  it('toggles favorite via the star button', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /favorite/i }))
    expect(state.updateLink).toHaveBeenCalledWith('l1', { favorite: true })
  })

  it('renders saved notes and edits on blur', async () => {
    state.links = [{ ...link, notes: 'my note' }]
    setup()
    const ta = screen.getByRole('textbox', { name: /notes/i })
    expect(ta).toHaveValue('my note')
    await userEvent.clear(ta)
    await userEvent.type(ta, 'updated note')
    await userEvent.tab()
    expect(state.updateLink).toHaveBeenCalledWith('l1', { notes: 'updated note' })
    state.links = [link]
  })

  it('shows the placeholder when there is no note', () => {
    setup()
    expect(screen.getByRole('textbox', { name: /notes/i })).toHaveAttribute('placeholder', 'Add a note…')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/routes/LinkDetail.test.jsx`
Expected: FAIL — no favorite button / notes textarea.

- [ ] **Step 3: Implement**

In `src/routes/LinkDetail.jsx`:

Update imports:

```jsx
import { ArrowLeft, ArrowSquareOut, ClockCounterClockwise, Star, StarFilled, Trash } from '@phosphor-icons/react'
import { favoriteOf, notesOf } from '../lib/linkDefaults'
```

In the controls row (where `StatusDot` and `PillSelector` sit), add the favorite toggle before `<StatusDot>`:

```jsx
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn-pill fav-toggle${favoriteOf(link) ? ' is-fav' : ''}`}
            aria-label="Favorite"
            aria-pressed={favoriteOf(link)}
            onClick={() => updateLink(link.id, { favorite: !favoriteOf(link) })}
          >
            {favoriteOf(link) ? (
              <StarFilled size={16} weight="fill" aria-hidden="true" />
            ) : (
              <Star size={16} weight="bold" aria-hidden="true" />
            )}{' '}
            Favorite
          </button>
          <StatusDot
            status={link.status}
            onToggle={() => updateLink(link.id, { status: isDraft ? 'saved' : 'draft' })}
          />
          ...
```

After the `{link.description && <p className="detail-desc">...}</p>}`, add the notes block:

```jsx
        <div className="field notes-field">
          <label className="mono" htmlFor="link-notes">Notes</label>
          <textarea
            id="link-notes"
            defaultValue={notesOf(link)}
            placeholder="Add a note…"
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v !== notesOf(link)) updateLink(link.id, { notes: v })
            }}
          />
        </div>
```

- [ ] **Step 4: Add the notes + fav-toggle styles**

In `src/styles/global.css`:

Extend the field control rule (line ~266) to include textareas:

```css
.field input, .field select, .field textarea {
  background: var(--bg); border: 1px solid var(--line);
  border-radius: var(--radius-card); padding: 12px 16px; outline: none;
}
.field input:focus, .field select:focus, .field textarea:focus { border-color: var(--line-strong); }
```

Add after the `.detail-meta` block (around line 243):

```css
.notes-field textarea { resize: vertical; min-height: 96px; font: inherit; color: var(--ink); }
.fav-toggle.is-fav { color: var(--accent); border-color: var(--line-strong); }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/routes/LinkDetail.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/routes/LinkDetail.jsx src/routes/LinkDetail.test.jsx src/styles/global.css
git commit -m "feat: favorite toggle and notes editing on link detail"
```

---

### Task 10: Notes field in AddLinkSheet

**Files:**
- Modify: `src/components/AddLinkSheet.jsx:10-51`
- Test: `src/components/AddLinkSheet.test.jsx`

- [ ] **Step 1: Write the failing tests**

In `src/components/AddLinkSheet.test.jsx`, the two existing `addLink` expectations must include `notes` (the payload now always carries it):

```jsx
  it('normalizes scheme-less URLs and submits with existing category', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/destination url/i), 'example.com/article')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(addLinkMock).toHaveBeenCalledWith({
        url: 'https://example.com/article',
        categoryId: null,
        notes: '',
      }),
    )
  })

  it('creates a free-text category before saving', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/destination url/i), 'https://example.com')
    await userEvent.selectOptions(screen.getByLabelText(/category/i), '__new__')
    await userEvent.type(screen.getByLabelText(/new category name/i), 'Recipes')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(addCategoryMock).toHaveBeenCalledWith('Recipes'))
    await waitFor(() =>
      expect(addLinkMock).toHaveBeenCalledWith({
        url: 'https://example.com/',
        categoryId: 'c9',
        notes: '',
      }),
    )
  })
```

Add a third test:

```jsx
  it('passes an optional note through to addLink', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/destination url/i), 'https://example.com')
    await userEvent.type(screen.getByLabelText(/notes/i), 'Read later')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(addLinkMock).toHaveBeenCalledWith({
        url: 'https://example.com/',
        categoryId: null,
        notes: 'Read later',
      }),
    )
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/AddLinkSheet.test.jsx`
Expected: FAIL — payloads lack `notes`, no notes textarea.

- [ ] **Step 3: Implement**

In `src/components/AddLinkSheet.jsx`:

Add `notesInput` state alongside `newName`:

```js
  const [notesInput, setNotesInput] = useState('')
```

Clear it when the sheet opens — add to the reset in the `open` effect:

```js
      setUrlInput(''); setCategoryId(''); setNewName(''); setNotesInput(''); setError(''); setSaving(false)
```

Pass `notes` in the submit call:

```js
    const created = await addLink({ url: normalizeUrl(urlInput), categoryId: finalCategoryId, notes: notesInput.trim() })
```

Add the notes textarea between the category select/new-category input block and the error line:

```jsx
              <label htmlFor="sheet-notes">Notes</label>
              <textarea
                id="sheet-notes"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Add a note…"
                rows={3}
              />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/AddLinkSheet.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AddLinkSheet.jsx src/components/AddLinkSheet.test.jsx
git commit -m "feat: optional notes field in the add link sheet"
```

---

### Task 11: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite**

Run: `npm test`
Expected: every test passes. If any test fails, fix the smallest unit affected, re-run, and commit the fix.

- [ ] **Step 2: Production build sanity check**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: full suite green for home tabs, favorites, and notes" --allow-empty
```

---

## Self-Review Notes

- **Spec coverage:** data layer (Tasks 1-3), accessors (Task 4), notes pass-through (Task 5), Quick Save (Tasks 6-7), Home tabs + empty states (Task 7), card favorite (Task 8), detail favorite + notes (Task 9), add-flow notes (Task 10). Every spec section maps to a task.
- **Placeholders:** none — every step contains literal code and commands.
- **Type consistency:** `favorite`/`notes` field names and `favoriteOf`/`notesOf` accessors are used identically across all tasks; `?tab=recent` and `?tab=stars` match the spec.