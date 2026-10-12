# STUDY NOTES — what the good references actually do (2026-10-12)

Studied live (1440×900 screenshots in `/workspace/how-to-live-better/study/*.png`, two scroll positions each):
Aceternity UI, Magic UI, Cult UI, Beautiful UI, React Bits, Refero, shadcnblocks, 21st.dev, Linear, Vercel, rauno.me,
plus the original HowToLiveBetter page (#e-1-16), `/workspace/ui-hub/DESIGN_BRIEF.md`, `ui-hub/previews/*.webp`
(Aceternity, Magic UI, Cult UI, React Bits, Beautiful UI, Originkit, shadcnblocks, 21st, Refero OG shots) and the skills
in `ui-hub/_orig/skills` (anthropics frontend-design, Leonxlnx taste-skill / soft-skill, pbakaus impeccable).

## The honest diagnosis of v1–v7
Every previous version was a *palette swap* over the same skeleton: centred hero → stats row → marquee → grid of
equal boxes. The references don't share a palette, they share **craft**: tight display type, a visible structural
frame, nested surfaces, one real product object as the hero, and quiet chrome. The "fancy" comes from precision,
not from glow. Seven of the eight best references are **light, neutral, near-black ink** — v5–v7 went dark+glow,
which is exactly the React Bits / "AI site" look the taste skills flag.

## 12 concrete patterns

| # | Pattern | Where I saw it | Spec I'm taking |
|---|---|---|---|
| 1 | **Blueprint frame**: full-height 1px vertical rails at the content edges, horizontal hairlines crossing them between sections, tiny "+" marks at the intersections | Magic UI (hero OG + home), shadcnblocks, Aceternity section 2 (dashed guides) | rails at `max-width` edges, `--line` 1px, `+` 9px at section joins; content never touches the rail (32px inset) |
| 2 | **Tight display type, two weights only** | Magic UI ("UI library for Design Engineers"), Aceternity, Vercel, Linear | H1 56–64px / 600 / tracking −0.035em / line-height 1.05; CJK H1 uses PingFang/Noto Sans SC 600, tracking −0.02em. No serif-italic accent word (anthropic skill: commonest AI tell) |
| 3 | **Two-tone lede**: first clause in ink, the rest in muted grey, one paragraph | Cult UI ("154 animated components, all free. Including 58 just added…"), shadcnblocks | 17–18px, ink `--fg` then `--fg-3` |
| 4 | **Announcement pill with split segment** | Cult UI ("58 new components │ Free and MIT licensed"), Magic UI, Aceternity ("Changelog │ 80+ new blocks →"), React Bits ("New │ Micro-interactions") | 28px pill, hairline ring, left segment ink/bold, right muted, chevron |
| 5 | **CTA pair**: solid near-black pill with inner top highlight + outline twin; primary has a soft multi-hue glow *under* it only | Aceternity (Browse Components / Get All-Access), Magic UI (blurred rainbow under both buttons), Vercel | 44px, radius 999, `inset 0 1px 0 rgba(255,255,255,.18)`; glow = blurred 3-stop gradient at 35% opacity, 12px below |
| 6 | **The product *is* the hero**: a real object in a window frame, not a stat row | Linear (app window), Aceternity (live site mock), React Bits (code panel with tabs), Refero (search box) | Hero right side = a real entry (#e-1-16 style) inside a window chrome with path bar + tabs to switch between three real 极高×A entries; cascaded sheets behind it |
| 7 | **Tray + tiles (double bezel)**: a textured outer tray (dot/pixel pattern) holding white tiles; tile = stage + hairline footer row with a small label left and "查看" right | Cult UI (Kanban/Fluted glass tray; "58 new components" grid: COMPONENT ··· VIEW →), soft-skill "Doppelrand" | tray radius 20 / pad 8 / dotted bg; tile radius 14, inner ring; footer 40px with hairline top |
| 8 | **Hairline cell grid** for dense indexes instead of floating cards | Vercel feature grids, Magic UI frame, Linear | 1px gaps over `--line` background so borders never double; hover = surface tint + arrow nudge; no shadows |
| 9 | **Muted wordmark strip** as social proof | Aceternity ("Used by… NEON, workbase…"), Vercel (Meta, OpenAI…), Refero (Atlassian, Plaid, ramp) | Our honest equivalent: the sources the book actually cites (国务院 132, 最高法 69, JAMA 40, Cochrane 34, Lancet 33…) — each a search link |
| 10 | **Search as object with suggestion lines** (`↳` rows + tabs) | Refero (Popular / Inspiration tabs, ↳ "Empty states with create-first CTA") | 52px field, ⌘K/“/” kbd, below it 2-col `↳` suggestions = real chapter questions |
| 11 | **Docs shell**: sticky left rail with section list, active row = filled pill; main column with numbered inline title "01 Loading State  short description"; hatch pattern outside the column | Beautiful UI, Linear sidebar | chapter page: 264px rail (filters as segmented controls + chapter list), entry header "16  title" inline, diagonal hatch on page gutters (very low contrast) |
| 12 | **Motion budget = one orchestrated moment + responsive feedback** | anthropic frontend-design ("one page-load sequence"), soft-skill (custom cubic-bezier, transform/opacity only), Cult UI hover nudges | one staggered hero load (blur 6px→0, y 12→0, 700ms `cubic-bezier(.22,1,.36,1)`); window tab switch cross-fade; hovers only move arrows 2px. No marquee, no aurora, no cursor spotlights, `prefers-reduced-motion` honoured |

## Colour (light first, dark is Linear-true-black, not tinted zinc)
- Light: canvas `#fafafa`, surface `#ffffff`, tray `#f4f4f5` w/ dots `#e4e4e7`, line `#e7e7ea`, ink `#09090b`, ink-2 `#52525b`, ink-3 `#a1a1aa`.
- Dark: canvas `#08090a`, surface `#0f1011`, tray `#121314`, line `rgba(255,255,255,.08)`, ink `#f7f8f8`, ink-2 `#a1a1aa`, ink-3 `#62666d` (Linear values).
- Accent is *functional*, from the content: evidence A `#16a34a`, B `#2563eb`, C `#a1a1aa`; 性价比极高 = ink-filled chip. The only "colour moment" is the Magic-UI glow under the primary CTA and the 说人话 callout's 2px gradient edge (green→blue = A→B).

## Explicitly rejected (from the skills + her feedback)
Purple/cyan glow, aurora blobs, marquee rows, giant empty cards, VitePress blue-grey, warm cream + serif + clay (anthropic list #1),
near-black + single acid accent (#2), ALL-CAPS tracked eyebrows, serif-italic accent word, cursor spotlights on every card.
