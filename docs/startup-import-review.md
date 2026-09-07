# Reviewing startup imports

Use source inspection, production build ownership and browser evidence together. A component below a conditional branch is a candidate for review, not automatically a defect. A small shared primitive or an immediately needed interaction may be better loaded eagerly.

## Repeatable workflow

1. Run `pnpm perf:imports`. It writes `.audit/source-imports.json` covering layer source imports and Vue component references, including conditions and line locations. Use `--output=/path/report.json` to retain a report. This source scan does not resolve generated auto-imports or downstream overrides.
2. Run the existing `pnpm perf:report` against the relevant consumer. It enables `STIR_PERF_ANALYZE` and records production chunk/module ownership. Keep build-size budgets distinct from route startup cost. Development Vite dependency optimization is not production loading evidence.
3. On a cold production-browser load, record JavaScript requests, coverage and long tasks before scroll or interaction. Repeat after reaching the component and after first keyboard/click activation. Resolve chunks through build metadata; do not hardcode hashed filenames.
4. Trace the import path to its owner. Record download, evaluation and component initialization separately. Check whether another visible feature requires the same dependency before claiming it can be removed.
5. Change the smallest feature boundary. Ordinary `Lazy` component imports suit existing conditional rendering. Viewport hydration requires separate readiness validation; it is not interchangeable with code splitting.
6. Verify SSR output, focus and first interaction. Measure at least three matched mobile runs before claiming a timing improvement. Run the repository's full required checks before shipping.

Prefer the Nuxt and Nuxt UI skills, current official documentation and installed component source. Skills identify supported mechanisms; only measurement establishes benefit in a consumer. Treat experimental APIs explicitly.

## Known examples

- Optional Drupal View filters, sorting and pagination load only in their existing rendered branches.
- Article sharing loads inside the article branch of the shared node renderer.
- Rich-text profile editors and ordinary versus searchable View selects use conditional imports. Text-only popups retain the existing inner lazy Webform boundary; another wrapper was not justified.
- View carousels retain ordinary async component loading but no longer use a visibility-only hydration gate: nested controls could otherwise miss their first activation. The broader automatic-hydration POC was not retained because cold first-interaction tests remained intermittent. No custom event replay or experimental Suspense boundary was added to the shipping layer.
- Keep existing conditional PDF, media-dialog and editor loading. Their presence in source does not prove they load on every page.

Do not convert every component to an async import. Additional request waterfalls, delayed interaction, SSR changes or extra wrappers can outweigh a size reduction. Preserve Drupal's rendering decisions and downstream component overrides.

## Regression reporting

The quality CI job generates the source inventory and publishes it as the `source-import-inventory` artifact. It is an informational report; conditional references do not become a new performance failure threshold.

Keep an evidence register with the route, feature state, import path, shared dependencies, measured costs, decision and validation. Start with reviewable reports rather than a brittle CI ban on particular chunk names. Promote narrow, stable route expectations to regression checks once representative fixtures exist.
