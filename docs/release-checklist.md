# Release Checklist

Use this checklist before tagging/releasing or merging dependency/performance changes.

## 1. Dependency updates (if applicable)

Run safe updates:

```bash
pnpm deps:update:safe
```

This command updates dependencies, syncs the README tech stack section, and runs the full verification gate.

If you are not updating dependencies, skip to step 2.

## 2. Quality gate

Run the full local gate:

```bash
pnpm verify:ci
```

This runs:

- `pnpm test`
- `pnpm test:nuxt`
- `pnpm test:e2e`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test:consumer:typecheck`
- `pnpm test:consumer:build`

## 3. Performance snapshot

Generate a fresh performance report:

```bash
pnpm perf:report
```

Review:

- `docs/perf-report.latest.json`
- Top client chunk changes
- Total output size changes

For changes affecting LCP, loading priority, media, hydration, motion, or
critical rendering, run a production build against a representative Drupal
payload before and after the change:

```bash
pnpm perf:lighthouse -- --url=https://staging.example.com --runs=3
```

For a local production build, use the lifecycle runner so stale builds and
uncompressed preview servers cannot affect the result:

```bash
pnpm perf:lighthouse:local -- --path=/ --runs=3
```

Report the before/after mobile medians for score, FCP, LCP, TBT, total transfer,
media transfer, and video request count.

## 4. Manual validation pass

In `pnpm dev`, verify critical UX paths:

- Homepage Drupal CE load
- One inner Drupal CE route
- Main menu fetch
- Webform submit flow
- Largest valid multi-file Webform when submission limits changed
- Paragraph text read and update endpoints when enabled
- Date/datetime fields (including multi-date required behavior)
- Modal/media interactions
- Any area touched by the PR

## 5. Deployment and edge prerequisites

Verify against the deployed CDN, load balancer, or ingress and retain evidence
in the release notes:

- Oversized fixed-length and chunked multipart requests are rejected before
  reaching Nitro.
- A persistent, atomic or provider-native edge limit protects
  `POST /api/auth/protected` using a trusted client-IP boundary.

## 6. PR/commit notes

Include in summary:

- User-facing behavior changes
- Config/env changes (if any)
- Dependency changes (and whether majors were avoided)
- Perf impact using `perf:report`, plus three-run mobile Lighthouse
  before/after medians when the conditional performance workflow applies

## 7. Final release checks

Before release/tag:

- Working tree is clean.
- CI is green.
- No unresolved TODOs/debug logs.
- Release version/changelog notes are correct.
