# Device context

**Harry's device: iPad Pro 11-inch**

## CSS viewport dimensions
- Portrait: ~820px wide (sits between `md:` 768px and `lg:` 1024px breakpoints)
- Landscape: ~1194px wide (`lg:` and above)

## Implications for all FE work
- `md:` breakpoint (768px) IS active in portrait — use this for portrait tablet layouts
- `lg:` breakpoint (1024px) is NOT active in portrait — it only applies in landscape
- Always verify at 820px (portrait) in addition to the standard 375 / 768 / 1024 checkpoints
- Grid columns: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` — portrait shows 3 columns, landscape shows 4
- The primary use case is portrait orientation

## Implication for the design system
The CLAUDE.md target of "1024px" refers to landscape orientation. Portrait on Harry's actual device is 820px — closer to the `md:` breakpoint than `lg:`. UX specs should explicitly distinguish portrait and landscape layouts where they differ.
