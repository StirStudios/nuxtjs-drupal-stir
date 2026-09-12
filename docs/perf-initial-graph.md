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
| 7.6 kB | `@plausible-analytics/tracker` | Consent-gated tracking. |

## Candidate levers, with measured value

Recovering roughly 10 kB would allow the caps to return to their previous
229 / 192.5. Measured candidates:

- **`@plausible-analytics/tracker` (~2.8 kB gzip).** Tracking is consent-gated,
  but the tracker is in the initial graph because both
  `layers/analytics/app/plugins/plausible-config-bridge.client.ts` *and*
  `@nuxtjs/plausible`'s own `plugin.client.js` import `init`/`track`
  statically. Lazy-loading only the layer plugin changes nothing; the module's
  plugin would have to be patched too (the repo already patches
  `nuxtjs-drupal-ce`, so the mechanism exists). Note the bridge plugin already
  reimplements init/track for the consent-deferred path, so the module is
  partly redundant — dropping it is an alternative to patching it.
- **`consola` (~3 kB gzip).** A logger in the production client entry. It
  arrives through Nuxt/ofetch internals rather than application code, so
  aliasing it out is fragile and risks losing error reporting.
- **nuxt-icon client bundle (~11 kB raw).** Only three icons are configured
  explicitly in `layers/platform/nuxt.config.ts` with `scan: false`; the other
  43 come from Nuxt UI's own declared icons. Trimming them makes those icons
  fall back to the runtime icon endpoint, trading bundle bytes for a request.

Even taken together the two low-risk levers total roughly 5.8 kB, so no
combination of them reaches the older cap on its own. Getting there means
reducing the Nuxt UI surface in the initial graph, which is a design change
rather than a configuration one.

## Validation requirement

Per `AGENTS.md`, any LCP, loading-priority or critical-rendering change must be
validated with `pnpm perf:lighthouse` against a representative Drupal payload:
at least three mobile runs, comparing medians before and after, reporting
score, FCP, LCP, TBT, total transfer, media transfer and video request count.
A bundle-size delta from `pnpm perf:report` alone is not sufficient evidence
for any of the levers above.
