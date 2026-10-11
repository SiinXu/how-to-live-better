# Visual system — Clarity Docs (v3)

Reading site for 《高性价比人生指南》. Deliberately **not** Warm Editorial Paper and **not** UI Resource Hub (midnight + electric cyan).

## Taken from the original (eternity4719.github.io/HowToLiveBetter)

| Strength | How we absorbed it |
|---|---|
| Cool neutral + brand blue | VitePress-like tokens: white/`#f6f6f7`, text `rgba(60,60,67,*)`, brand `#3451b2` (dark: `#1b1b1f` / `#a8b1ff`) |
| Left sidebar filters | Chapter page sticky sidebar: 章节 TOC + 性价比 / 证据 / 换回什么 chip groups with `aria-pressed` |
| Card anatomy (`#e-1-16`) | idx · title · `#` anchor; color badges; 「说人话」 left-blue callout; cost/gain/note always visible as 2-col rows; 来源 in `<details>` |
| Evidence badge colors | A green soft, B yellow soft, C gray soft; 性价比极高 brand-soft, 高 green-soft |
| Filter chips | Pill chips, pressed = brand soft fill; same within-group OR / across-group AND semantics |
| Density & clarity | 14px/1.7 body, soft gray cards, hover border only, `content-visibility` on entries |
| Deep link flash | `#/c/1/16` and original-style `#e-1-16` both work; flash highlight on focus |
| Mobile | Sticky filter bar, chapter select, bottom tabs; rows collapse to 1-col |

## What we kept from our site

- Full SPA: home / chapter / search / docs / glossary / 核实记录 / about
- 677 entries from `book.json`, search + multi-dim filters, CC BY attribution
- Long-form prose reader with TOC, theme toggle, copy-link

## Non-goals

- Not cloning Warm Paper (parchment + cinnabar + Instrument Serif)
- Not cloning UI Hub cyan glow
- Not changing entry text or evidence content
