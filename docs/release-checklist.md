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
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## 3. Performance snapshot

Generate a fresh performance report:

```bash
pnpm perf:report
```

Review:

- `docs/perf-report.latest.json`
- Top client chunk changes
- Total output size changes

## 4. Manual validation pass

In `pnpm dev`, verify critical UX paths:

- Webform submit flow
- Date/datetime fields (including multi-date required behavior)
- Modal/media interactions
- Any area touched by the PR

## 5. PR/commit notes

Include in summary:

- User-facing behavior changes
- Config/env changes (if any)
- Dependency changes (and whether majors were avoided)
- Perf impact using `perf:report`

## 6. Final release checks

Before release/tag:

- Working tree is clean.
- CI is green.
- No unresolved TODOs/debug logs.
- Release version/changelog notes are correct.
