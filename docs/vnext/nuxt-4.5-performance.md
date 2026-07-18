# Nuxt 4.5 performance evaluation

This document preserves the measured Nuxt 4.4 baseline and records the Nuxt
4.5 upgrade results separately. Measurements use a production build of the
full shared layer on the same Apple Silicon host. Downstream Lighthouse and
SSR-streaming measurements are recorded below.

## Shared-layer production bundle

| Metric | Nuxt 4.4.8 | Nuxt 4.5.0 | Change |
| --- | ---: | ---: | ---: |
| Initial client, gzip | 198.72 kB | 227.86 kB | +29.14 kB (+14.7%) |
| Initial JavaScript, gzip | 162.77 kB | 191.60 kB | +28.83 kB (+17.7%) |
| Initial CSS, gzip | 35.95 kB | 36.26 kB | +0.31 kB (+0.9%) |
| Initial client modules, rendered | 1,087.94 kB | 1,029.99 kB | -57.95 kB (-5.3%) |
| Client build | 7.48 s | 3.40 s | -4.08 s (-54.6%) |
| Server build | 5.54 s | 2.99 s | -2.55 s (-46.0%) |
| Total server artifact, gzip | 11.5 MB | 11.1 MB | -0.4 MB (-3.5%) |

The comparison above rebuilds the untouched Nuxt 4.4 commit with the same
graph-aware analyzer used for Nuxt 4.5. The Nuxt 4.5 entry file itself is only
40.40 kB gzip, but Vite 8/Rolldown emits its static dependencies as 62 files
instead of one. The initial figure follows that complete graph; it does not
incorrectly count only the named entry file.

Nuxt 4.5 renders 5.3% fewer initial module bytes and builds approximately
twice as fast. Its gzip sum is larger because separately compressing many
small files loses cross-module compression. A supported Rolldown grouping
experiment reduced the gzip sum by only 5.62 kB and introduced manual
chunk-order risk, so it was rejected. Runtime network and Lighthouse results
will determine whether automatic chunking needs further work.

The Tiptap/ProseMirror editor remains deferred. Its 158.02 kB gzip dependency
chunk is reachable from the lazy editor entry and is not part of the initial
anonymous client graph.

## Toolchains

| Baseline | Nuxt | Vite | Vue | Tailwind CSS |
| --- | --- | --- | --- | --- | --- |
| Before | 4.4.8 | 7.3.6 | 3.5.39 | 4.3.2 |
| After | 4.5.0 | 8.1.5 | 3.5.40 | 4.3.3 |

## Evidence files

- `docs/perf-report.latest.json`: preserved Nuxt 4.4 full-layer baseline.
- `docs/perf-report.nuxt-4.5.json`: Nuxt 4.5 full-layer measurement.
- `docs/perf-report.minimal.latest.json`: preserved minimal-preset baseline.

## RSF production Lighthouse

Three-run production measurements showed that individual Lighthouse scores
on content-heavy routes can vary substantially even when transferred bytes,
main-thread work, and blocking time remain stable. The live `/about` route
scored 81, 93, and 94 in consecutive runs. Its main-thread work remained
between 0.92 and 0.96 seconds and TBT remained between 40 and 62 milliseconds;
the score swing came from synthetic FCP/LCP timing. Performance decisions must
therefore use a three-run median rather than a single score.

The below-fold client-logo carousel was not the LCP element. Visible
hydration and viewport-aware autoplay remain worthwhile because they avoid
activating off-screen interaction and motion, but they are not represented as
a Lighthouse-score improvement.

## SSR streaming decision

SSR streaming is **not enabled by default**. A controlled production build
reduced warm first-byte time from approximately 106–143 milliseconds to
approximately 3–5 milliseconds. That apparent improvement was an invalid
partial response. The deterministic E2E fixture confirmed that both a valid
public Drupal page and authenticated protected Drupal HTML commit the shell
before Drupal-derived response handling completes. The resulting response is
HTTP 200 with an embedded 500 payload: `Cannot set headers after they are sent
to the client`. Protected HTML also loses the guarantee that its final
`private, no-store` policy is applied before bytes are sent.

This is incompatible with the platform's catch-all Drupal routing, where the
CMS response can legitimately determine a redirect, 404, access result, or
cache header during rendering. Static route exclusions cannot describe that
runtime state safely, and maintaining lists of Drupal paths would undermine
the shared layer. Streaming remains rejected until Nuxt can preserve those
late status/header semantics or the platform can decide them before the shell
flush. Restricting streaming to an explicit set of Nuxt-owned pages would add
a second routing policy for little representative gain, so the layer does not
expose that partial mode either.

## Rspack decision

Rspack 2 is **not adopted**. The official Nuxt Rspack 4.5 builder failed the
shared-layer production client build on two compatibility surfaces:

- resolution of the generated `#stir-presentation-source` CSS alias;
- parsing of generated Nuxt UI modules.

Adding bundler-specific alias and generated-code workarounds would increase
maintenance risk for no proven runtime gain. Vite 8/Rolldown remains the
shared default: it already reduced client and server build times by roughly
half, passes the full verification matrix, and requires no downstream changes.
