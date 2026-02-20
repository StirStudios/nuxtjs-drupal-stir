# Release Notes - 4.2.0

Range: `4.1.41..0fc0f33`
Date: 2026-02-20

## Summary
This release hardens the Nuxt layer across configuration, popup behavior, webform UX/hydration, accessibility, and shared typing. It also introduces the new `privacyNotice` config model, updates dependency locks, and includes broad consistency/refactor cleanup across app/server/utils.

## Breaking Changes
- `cookieConsent` config key was removed.
- Use `privacyNotice` instead.

Migration:

```ts
// before
cookieConsent: {
  enabled: true,
  mode: 'notice',
  title: '...'
}

// after
privacyNotice: {
  enabled: true,
  mode: 'notice',
  title: '...'
}
```

## Added
- New `PrivacyNotice` component with:
  - `mode: 'notice' | 'consent'`
  - `position: 'left' | 'center' | 'right'`
  - optional dismiss behavior
  - dev setup warning state when enabled but not configured
- Popup route targeting controls:
  - `popup.includePaths`
  - `popup.excludePaths`
- `usePopupBehavior` composable for shared popup logic.
- Health endpoint for CI probing: `server/api/health.get.ts`.
- Additional docs and guardrails:
  - `docs/codebase-consistency.md`
  - `docs/dependency-update-policy.md`
  - `docs/release-checklist.md`

## Changed
- App config/docs/types were expanded and standardized (`app/types/app-config.d.ts`, `docs/stir-theme-config.md`).
- Plausible analytics integration was consolidated around app config usage.
- Sitemap runtime cache behavior was adjusted to prevent stale output after deploy.
- Field and paragraph components were normalized for spacing, structure, and cross-layer consistency.
- Client bundle behavior improved via Nuxt icon bundling and multiple reactive-cost reductions.
- CI workflow and smoke/health checks were refined for deterministic behavior.

## Fixed
- Header static-mode scroll-up visibility regression.
- Popup behavior on client-side route navigation (soft route transitions now retrigger correctly).
- Date/date-time picker UX: close picker after single date selection.
- Multiple hydration and SSR parity issues (tabs, animation, webform readiness, field rendering).
- Accessibility fixes across fields/labels/turnstile usage.
- PDF viewer/modal behavior and related paragraph modal handling.
- Type import/c12 resolution issues in consumed apps.

## Performance
- Reduced reactive churn in popup/slots/video/yup-related paths.
- Lazy loading refinements for webform schema and modal/pdf flows.
- Icon bundle optimization integrated into client build.

## Dependency Updates
- `package.json` and `pnpm-lock.yaml` updated.
- Latest dependency state captured by commit `0fc0f33`.

## Verification Notes
- Lint and test-related hardening were included across the range.
- Before publishing, run:
  - `pnpm lint`
  - `pnpm build`
  - `pnpm test`

## Commits in Range
Use this to inspect exact history:

```bash
git log --oneline 4.1.41..0fc0f33
```
