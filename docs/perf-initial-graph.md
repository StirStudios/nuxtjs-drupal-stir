# Initial client graph: measured composition

Why this exists: `docs/perf-budget.json` caps the initial graph, CI enforces
those caps, and `tests/utils/layerContract.spec.ts` ratchets them so they only
move down. The caps were re-baselined to the measured Nuxt 4.5 graph
(**235.95 kB initial / 202.69 kB JavaScript**, capped at 237 / 204) because the
previous 229 / 192.5 pair predated that measurement, had been exceeded ever
since, and was only ever warned about -- so it created no pressure to come down
and no protection against going further up.

Recovering those bytes is still worthwhile, and the caps should be ratcheted
back down as it happens. This file records what the graph is actually made of
so that work starts from measurement rather than guesswork.

Regenerate with `pnpm perf:report`; the raw data lands in
`docs/perf-report.latest.json` under `initialClient.entryModules`.

## Composition (raw bytes, top entry modules)

| Raw | Module | Notes |
| --- | --- | --- |
| 254.6 kB | `@vue` | Framework. Not reducible. |
| 87.8 kB | `tailwind-variants` | Nuxt UI's styling engine. |
| 53.5 kB | `@vueuse` | Broadly used across the theme layer. |
| 49.8 kB | `vue-router` | Framework. |
| 42.6 kB | `nuxt` | Framework. |
| 38.0 kB | `@iconify` | Icon runtime. |
| 34.7 kB | `unhead` | Head management. |
| 13.6 kB | nuxt-icon client bundle | 46 icons. |
| 13.4 kB | `ui/button` | Nuxt UI component. |
| 8.7 kB | `consola` | Logger. |

## First-party share (measured 2026-09-21)

Of the ~675 kB rendered across the tracked initial modules, **9.6 kB is
first-party**: the theme's `app.config`, which carries the design tokens
components read at runtime. Everything else is framework or library code —
Vue (~255 kB across runtime-core, runtime-dom and reactivity), Nuxt UI's
`tailwind-variants` (~88 kB), `vue-router`, Nuxt, Iconify, unhead and VueUse.

So the initial graph cannot be shrunk meaningfully by trimming layer code: the
layer already keeps editorial, admin, auth and listing code out of the
anonymous initial path. Reductions have to come from dependency and design
decisions, such as the levers below, not from refactoring.

## Candidate levers, with measured value

Recovering roughly 10 kB would allow the caps to return to their previous
229 / 192.5. Measured candidates:

- **`@plausible-analytics/tracker` — done (2.4 kB gzip recovered).** The
  layer's bridge plugin now owns the tracker and loads it with a dynamic
  import once tracking is enabled and consent allows it, and the analytics
  layer drops `@nuxtjs/plausible`'s own client plugin (which imported it
  statically) through the `app:resolve` hook. The initial graph went from
  237.01 to 234.62 kB. Lighthouse medians of three mobile runs were unchanged
  before and after (score 80, FCP 3.09 s, LCP 4.30 s, 0.76 MB transfer; TBT
  varied 50–73 ms in both builds), as expected for a saving below its
  reporting precision.
- **`consola` (~3 kB gzip).** A logger in the production client entry. It
  arrives through Nuxt/ofetch internals rather than application code, so
  aliasing it out is fragile and risks losing error reporting.
- **nuxt-icon client bundle (~11 kB raw).** Only three icons are configured
  explicitly in `layers/platform/nuxt.config.ts` with `scan: false`; the other
  43 come from Nuxt UI's own declared icons. Trimming them makes those icons
  fall back to the runtime icon endpoint, trading bundle bytes for a request.

With the tracker lever taken, consola is the remaining low-risk candidate at
roughly 3 kB, which does not reach the older cap on its own. Getting there means
reducing the Nuxt UI surface in the initial graph, which is a design change
rather than a configuration one.

## Validation requirement

Per `CLAUDE.md`, any LCP, loading-priority or critical-rendering change must be
validated with `pnpm perf:lighthouse` against a representative Drupal payload:
at least three mobile runs, comparing medians before and after, reporting
score, FCP, LCP, TBT, total transfer, media transfer and video request count.
A bundle-size delta from `pnpm perf:report` alone is not sufficient evidence
for any of the levers above.
