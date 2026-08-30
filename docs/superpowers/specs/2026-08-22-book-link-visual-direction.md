# Book Link — Visual Direction

Date: 2026-08-22
Extends: `2026-08-22-book-link-design.md` (approved)
Status: Approved refinements — feed into implementation plan

## Design Read

*Consumer utility app for link-savers, with a "wireframe-as-brand" monochrome
language, leaning toward Apple-adjacent premium restraint.*

**Dials:** VARIANCE `5` · MOTION `7` · DENSITY `3`

The wireframe aesthetic is the brand: visible hairline strokes, pill shapes,
annotation-style metadata. Everything else stays quiet so saved-link preview
images carry the color.

## Deviations From the Base Spec (signed off)

| Base spec said | Refined to | Why |
|---|---|---|
| Literal white surfaces / black icons | Near-black `#141414` ink on paper `#F4F4F2` | Pure `#000/#fff` reads harsh, vibrates on OLED, fails contrast nuance |
| QR reveal "subtle glow ring" | Expanding **hairline ring** (no glow) | Outer glows are an AI-generic tell; hairline fits wireframe language |
| Route transition uses "slight blur" | Blur removed from routes; reserved for AddLinkSheet backdrop only | Animating `filter` breaks the transform/opacity-only rule and janks on low-end devices |
| No font named | **Satoshi** (self-hosted via Fontshare) | Avoids Inter-default slop; Black weight carries massive uppercase headers |
| Light only implied | Dark mode via CSS custom properties from day one | Monochrome inverts trivially now, painfully later |

## Color System

Single chromatic accent: **status green**. Everything else is the ink ramp.
Green appears *only* as the status dot and focus accents — never decoration.

### Tokens (CSS custom properties)

```css
:root {
  /* Light */
  --bg:          #F4F4F2;   /* page */
  --surface:     #FCFCFB;   /* cards, pills, sheets */
  --ink:         #141414;   /* primary text, icons */
  --ink-2:       #45453F;   /* secondary text */
  --ink-3:       #75756E;   /* muted / annotations */
  --ink-disabled:#B8B8B2;
  --line:        rgba(20, 20, 20, 0.08);   /* default hairline */
  --line-strong: rgba(20, 20, 20, 0.18);   /* hover border */
  --dot-draft:   var(--ink);
  --dot-saved:   #2F9E60;
  --shadow-lift: 0 8px 24px rgba(20, 20, 20, 0.06);
}

[data-theme="dark"] {
  --bg:          #131312;
  --surface:     #1C1C1B;
  --ink:         #F1F1EE;
  --ink-2:       #C2C2BC;
  --ink-3:       #8F8F89;
  --ink-disabled:#55554F;
  --line:        rgba(241, 241, 238, 0.10);
  --line-strong: rgba(241, 241, 238, 0.22);
  --dot-saved:   #3DD68C;
  --shadow-lift: 0 8px 24px rgba(0, 0, 0, 0.35);
}
```

Theme resolution order: `localStorage("bl-theme")` → `prefers-color-scheme`.
Toggle lives in the Profile kebab menu (v1.1+; attributes wired now).

## Typography

**Satoshi** via Fontshare, self-hosted fallback after first load:

```html
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">
```

| Role | Spec |
|---|---|
| Display (Collections header) | Satoshi Black 900, UPPERCASE, `clamp(2.75rem, 8vw, 6.5rem)`, leading 0.95, tracking `-0.02em` |
| Card titles / UI labels | Satoshi Medium 500, 15–16px, leading 1.3 |
| Body (link descriptions) | Satoshi Regular 400, 16px, leading 1.6, `max-width: 65ch` |
| Metadata ("annotation voice") | System mono stack*, 11–12px UPPERCASE, tracking `+0.08em`, color `--ink-3` |

\* `ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace`
Mono is used **only** for domain pills, IDs, and link-count annotations — it's
the wireframe "spec annotation" voice. Never for titles.

## Shape & Elevation

Wireframe = strokes first, shadows second.

```css
--radius-card: 24px;   /* link cards, category cards */
--radius-hero: 32px;   /* detail-view preview, QR plate */
--radius-pill: 999px;  /* nav, pills, selectors, buttons */
--radius-sheet: 28px 28px 0 0;
```

- Default element border: `1px solid var(--line)`
- Hover: border → `var(--line-strong)` + `translateY(-2px)` + `var(--shadow-lift)`
- Active/press: `scale(0.98)` (cards) / `scale(0.96)` (pills, buttons)
- The **"+" add card**: `1.5px dashed var(--ink-disabled)` → solid `var(--ink-3)`
  on hover. Dashed border is the intentional wireframe tell.

## Icons

**Phosphor**, Light weight only, one family everywhere.
Sizes: 20px (nav/search), 24px (profile action circles).
Stroke weight visually matches hairlines. Kebab menu = `DotsThreeOutlineVertical` glyph.

## Motion Tokens

All animation on `transform`/`opacity` only. Global `prefers-reduced-motion`
kill-switch: every effect below becomes an instant state change; stagger,
pulse, and breathing loops are disabled entirely.

```js
export const ease = [0.32, 0.72, 0, 1];            // route/base easing
export const springLayout = { stiffness: 340, damping: 32, mass: 0.9 };  // card → hero morph
export const springPop    = { stiffness: 260, damping: 20 };             // QR reveal, sheet
export const STAGGER_MS   = 40;
export const PRESS_SCALE_CARD  = 0.98;
export const PRESS_SCALE_PILL  = 0.96;
```

| Moment | Implementation |
|---|---|
| Route exit | `{ opacity: 0, scale: 0.98 }`, 220ms, `ease` |
| Route enter | from `{ opacity: 0, y: 12, scale: 0.99 }`, springLayout |
| Grid first load | children stagger 40ms, fade + 12px rise |
| Card → detail hero | Framer Motion shared `layoutId="preview-{id}"`, springLayout |
| Breathing "+" card | `scale: 1 ↔ 1.015`, 3s ease-in-out infinite loop |
| Sheet open | backdrop `rgba(20,20,20,0.35)` + `backdrop-filter: blur(8px)` (static, not animated); sheet springs up with springPop |
| Status toggle | dot cross-fades 180ms; always paired with text label ("Draft"/"Saved") — never color-only |
| QR reveal | springPop + one-shot hairline ring: pseudo-element ring scales `0.92 → 1.06`, fades out, 480ms |

## Component Treatments

- **NavBar** — floating centered pill: `--surface`, hairline border,
  `padding 10px 18px`, search input inside; sits `top: 16px`, z-index above content.
- **LinkCard** — 1:1 preview tile (`--radius-card`, overflow hidden, image
  `object-fit: cover`) + two pills beneath: title pill (`--surface`,
  hairline border, Medium 500) and domain pill (mono annotation voice).
  Fallback when no og:image: monochrome letter tile — `--line` background,
  huge Satoshi Black first letter of the domain, centered.
- **CategoryCard** — identical anatomy to LinkCard for visual continuity.
- **Skeleton loading** — grid renders skeleton LinkCards (same exact layout),
  tiles pulsing opacity `0.5 ↔ 1`, 1.4s. Never spinners.
- **Empty states** — composed, instructive: e.g. Dashboard empty →
  "Nothing saved yet." in `--ink-3` with a thin arrow glyph pointing at the
  "+" card. Detail-not-found → same treatment with a "Back" pill.
- **Focus rings** — `outline: 2px solid var(--ink); outline-offset: 2px`
  (green in dark mode for visibility). All touch targets ≥ 44×44px.
- **Contrast floor** — body copy never lighter than `--ink-2`;
  `--ink-3` reserved for ≥ 14px annotations only.

## View-Specific Notes

1. **Dashboard** — rows of 5 on desktop (≥1200px), 3 on tablet, 2 on mobile;
   horizontal gap 16px, vertical gap 20px. Max content width 1120px, centered.
2. **Collections header** — display type may bleed to viewport edges; cards
   stay in the 1120px container. Header margin-bottom generous (~48px).
3. **Detail** — left hero sticks on scroll (desktop); right column starts with
   the two PillSelectors, dot square indicator 12×12px beside them.
4. **Profile** — QR plate: `--surface`, `--radius-hero`, 1:1, QR quiet zone ≥
   2 modules; action circles 56px, hairline border, press scale 0.96.

## Anti-Slop Checklist (final pass)

| Rule | Status |
|---|---|
| Max 1 accent color | ✅ Green, functional only |
| No AI purple / neon glows | ✅ Grayscale + hairline ring |
| Not Inter-default | ✅ Satoshi |
| No emojis in UI | ✅ Phosphor glyphs |
| No div fake screenshots | ✅ Real og:image / letter-tile fallback |
| Skeleton loaders match final layout | ✅ |
| Composed empty states | ✅ |
| Tactile `:active` feedback | ✅ Scale tokens above |
| Reduced-motion honored | ✅ Global kill-switch |
| Both themes designed | ✅ Token pairs defined up front |
