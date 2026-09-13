# Changelog

Consumer-affecting changes to the layer. Downstream projects track this
repository as a git branch rather than a published version, so anything that
can break a `pnpm install` or a `pnpm typecheck` belongs here — a GitHub
release does not reach a consumer pinned to `#dev`.

Record an entry when a change is visible from outside the layer: a removed or
renamed export, a changed public composable or component contract, a new or
altered server route, a behavioural change a consumer could notice, or a new
required environment variable. Internal refactors that leave the public surface
untouched do not need one.

## Unreleased

### Removed

- **Breaking.** The rename-only aliases over the shared Drupal request helpers
  are gone. They forwarded to canonical names with no behaviour of their own:

  | Removed | Use instead |
  | --- | --- |
  | `layerAuthThrowDrupalApiError` | `throwStirDrupalApiError` |
  | `layerAuthExtractDrupalErrorDetail` | `extractStirDrupalErrorDetail` |
  | `layerAuthGetDrupalApiConfig` | `getStirDrupalApiConfig` |
  | `layerAuthGetForwardedCookie` | `getStirForwardedCookie` |
  | `layerAuthAppendDrupalSetCookies` | `appendStirDrupalSetCookies` |
  | `layerAuthBuildDrupalHeaders` | `buildStirDrupalHeaders` |

  All are importable from
  `layers/foundation/server/utils/stirDrupalApi`. `layerAuthDrupalApiRequest`
  is unchanged — it defaults `forwardClientIp` and is not a rename.

  `layers/core/server/utils/drupalApi.ts`,
  `layers/core/server/utils/drupalHeaders.ts` and
  `layers/auth/server/utils/drupalHeaders.ts` were removed for the same reason.

- `useAuthAccount` — a thin re-export of four `useAuthApi` methods with no
  consumers in the layer or any known downstream project. Use `useAuthActions`.
- App config settings that no layer code has ever read, with their defaults,
  types and docs: `stirTheme.heading`, `stirTheme.header`, `stirTheme.frontPage`
  and `stirTheme.mediaModal.description.default`; the app-config types for
  `protectedRoutes.redirectOnLogin` and `analytics.plausible.apiHost`,
  `autoPageviews`, `autoOutboundTracking`, `fileDownloads` and `formSubmissions`
  (Plausible options are runtime config, see the analytics docs); and the
  docs-only `grid.separator` section. Rendered output does not change. Theme
  types still accept unknown keys, so projects that set these keep type-checking;
  the values simply do nothing, as before. The unread `center` field is also gone
  from the internal footer theme resolver.

### Added

- `DrupalViewDisplay` and `drupal-view--default` accept a `controls` slot, so a
  project can replace only the filter and sort bar of a Drupal view. The layer
  still resolves `?page=N` during SSR and keeps crawlable pager links, rows,
  loading, empty and error states, the grid image profile and the query
  namespace. The slot receives `DrupalViewControlsSlotProps`: `filters`,
  `filterValues`, `sort`, `sortByOptions`, `sortOrderOptions`, `sortValues`,
  `activeFilters` (with `label` and an accessible `removeLabel`), `isLoading`,
  and the actions `setFilter`, `setSort`, `removeFilter`, `resetFilters`,
  `resetSort` and `resetControls`. With a slot, the layer also renders a
  visually hidden `role="status"` region that announces result updates. Views
  without the slot render exactly as before. `useDrupalViewControls` returns the
  same `activeFilters`, `removeFilter`, `resetFilters` and `resetSort`.
- `RichTextHtml` renders the trusted HTML of `EditableRichText`, and so of Text
  and Hero paragraph copy. Projects can override it to expand their own inline
  embeds. The default output is unchanged: one `div` with the same classes and
  `v-html` content.
- `stir-compliance` now discovers the services a site actually runs from the
  Drupal config export, `app/app.config.ts`, and environment variable names,
  and applies only the rules that evidence triggers: Webforms, Turnstile,
  Plausible, Bunny, email delivery, remote video, Instagram, public accounts,
  payments, automatic renewal, newsletters, saved activity, the privacy notice,
  and UserWay. An active service missing from `compliance/site.json` or from the
  legal copy is an error; record an installed but unused one under
  `technology.inactive` with the reason.
- Legal copy can be tracked in `compliance/legal/<alias>.html` (or
  `documents.<key>.file`) and applied with the Stir Tools command
  `drush stir-tools:compliance-content`. The audit checks disclosures against
  those files, or the rendered pages at `owner.domain`.
- **Action required.** `compliance/REVIEW.md` gains a "Tracked legal copy"
  checklist. Run `pnpm exec stir-compliance-init` after updating, or
  `pnpm audit:compliance` reports the checklist as outdated.
- `useAuthLogin(options?)` takes an optional `redirectTo` callback for
  destinations that can only be decided once the session resolves. It also
  honours `?redirect=` with the Drupal-configured `loginRedirectPath` as
  fallback. Calling it with no argument and no query parameter behaves as
  before. See `layers/auth/README.md`.
- The account settings guard now carries its destination on `?redirect=`, so a
  signed-out visitor following a link there returns after signing in.
- `resolveAuthSessionAccess(session)` projects an auth-session snapshot onto the
  editorial access shape, so role rules stay defined once alongside
  `resolveDrupalPageAccess`.
- Page heroes gain `stirTheme.hero` options so projects no longer need to
  replace `ParagraphHero`: `nodeTypes` (per Drupal node type `layout:
  'background' | 'inline'` and `media: 'first' | 'last'`), `inline.base` and
  `inline.text` classes, `textSpacing` for text-only heroes, and a decorative
  `backdrop` for text-only inner-page heroes. Defaults leave existing output
  unchanged. `HeroContent` receives the resolved `layout` prop, and its H1 now
  uses the existing `hero.text.heading` classes (default `mb-0`, as before).
  In `mode: 'simple'`, the `classes` prop now wraps the slots instead of being
  ignored.
- `RevealMotionElement` accepts shorthand props (`effect`, `delayMs`,
  `durationMs`, `distancePx`, `rootMargin`) for component-authored reveals, so
  projects no longer need their own motion-v wrapper. Shorthand reveals use the
  same reduced-motion, SSR-visible and `animations.once` handling as Drupal
  paragraph reveals. `getRevealMotionProps` / `useRevealMotionProps` accept the
  same `durationMs`, `distancePx` and `rootMargin` overrides; `motionProps`
  still takes precedence and is unchanged.
- `useDrupalPageNodes` gains `links()`, `linkOf(node)`, `imageProps()` and
  `textPropsOf(node, classes?)`, with standalone `isDrupalPageLinkNode` and
  `getDrupalPageNodeLink` exports, so page components stop re-implementing
  link, image and rich-text mapping. `toEditableRichTextProps(props, classes?)`
  in `utils/editableRichText` is the shared mapping that `ParagraphText` now
  uses too.
- Header options so projects no longer need to replace `App/Header.vue`:
  `navigation.desktopLayout: 'centered-toggle'` (the toggle is the only
  navigation at every breakpoint), `navigation.toggleClass`,
  `navigation.toggleComponent` (receives `open` and `scrolled`),
  `navigation.actionsComponent` (receives `scrolled`, rendered in the right
  region), and `navigation.slideover.content`, `portal`, `overlay` and
  `unmountOnHide`. Component names resolve against globally registered
  components; unknown names render nothing. `stirTheme.clientComponents` mounts
  named browser-only components, such as a cursor or page transition, once in
  `app.vue`. Defaults leave the existing header output unchanged.
- The header menu returns focus to its toggle when a visitor closes it, but not
  after a menu link navigates.
- `stirTheme.hero.front` configures the front-page hero title without a
  `HeroContent` override: `subtitle: 'below'` keeps the page title as the H1
  and renders the authored header, or else the site slogan, as an H2 styled by
  `subtitleClass`; `showText: false` hides the hero text on the front page.
  Defaults (`subtitle: 'replace'`, `showText: true`) leave output unchanged.
  `ParagraphHero` now passes the site slogan to `HeroContent` as `siteSlogan`.
- `StirPdfViewer` renders the real `vue-pdf-viewer-core` viewer when a project
  installs that package's Nuxt module, and keeps the lightweight stub otherwise,
  so projects no longer need their own `StirPdfViewer.client.vue` wrapper.
  `overrideFallbackComponent` accepts an optional `when` predicate.
- `useFooterData()` returns `footerMenu`, `footerMenuItems` and `siteInfo` from
  the current Drupal page, falling back to the app footer context (loaded during
  SSR and when a client-side page lacks the data). `AppFooter` uses it, so
  custom project footers no longer need to copy that loading logic.

### Changed

- **Breaking.** `stir-seo` and `stir-compliance` no longer read `SEO_SITE_URL`
  or `COMPLIANCE_SITE_URL`, or any other environment variable, for their
  target. Both always audit `owner.domain` from `compliance/site.json`, so a
  local or staging value cannot point them at the wrong site, and
  `stir-compliance` now checks the rendered legal pages on every run. Pass
  `--url <origin>` to audit another origin deliberately.
- **Protected pages are enforced at the server boundary.** Gating lived only in
  the route middleware, so the page payload behind a protected route stayed
  fetchable from `/api/drupal-ce/<path>`. Requests for a configured protected
  path now need a valid protected-access cookie, or a verified Drupal session
  where `allowAuthenticatedUserBypass` is on. `requireLoginPaths` remains the
  single authoring surface in `app.config.ts`; no consumer configuration
  changes. Note this is a Nuxt-local gate, not Drupal access control.
- Non-`GET` requests through `/api/drupal-ce` now require a matching origin.
  Reads are unaffected. A consumer that posts cross-origin to that proxy will
  receive a 403.
- The initial-graph performance budget was re-baselined to the measured Nuxt
  4.5 numbers and is now enforced in CI rather than warned about. A breach
  names the packages that grew. See `docs/perf-initial-graph.md`.
- The published archive budget rose from 310000 to 340000 bytes. The archive
  is 320089 bytes after the hero, reveal, header, footer and page-node
  additions; the budget catches accidentally published directories, not
  feature code, so it keeps about 20 KB of headroom.

### Fixed

- **Editorial tabs return for administrators on mixed routes.** Access was
  resolved from the current Drupal page payload alone, so `DrupalTabs`
  disappeared on any route whose payload carries no `local_tasks`.
  `usePageContext` merges an administrator session back in. The session lookup
  stays behind a client-only render: `drupal-session-no-ssr` already disables
  SSR for any request carrying a Drupal session cookie, so a server-rendered
  public page never reaches `/api/auth/session`.
- **Open redirect.** `useProtectedLogin` accepted any redirect starting with
  `/`, so a protocol-relative `//evil.com` navigated off-site. Both auth
  composables now share a validator that rejects protocol-relative and
  backslash-escaped hosts, absolute URLs and control characters, and applies
  the same rule to the Drupal-owned fallback.
- Nuxt UI's timeline renders its date as `text-dimmed`, which measured 3.67:1
  at 12px on the dark surface against the 4.5:1 WCAG 2.2 AA requirement. The
  paragraph timeline overrides that slot. The shared token is untouched.
