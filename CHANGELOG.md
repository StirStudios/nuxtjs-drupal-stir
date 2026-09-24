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

- **Breaking.** `usePageContext().isAdministrator` and the `isAdministrator`
  field of `resolveDrupalPageAccess()` / `mergeDrupalPageAccess()` are gone.
  They string-matched the `administrator` role, which Drupal never uses to
  decide access. Use `hasEditorialAccess` for editorial chrome and
  `canEditInline(editLink)` for inline edit controls.

### Added

- `stirTheme.presentation` declares the Surface and Variant choices editors
  pick in Drupal, replacing free-text classes. The layer provides Default,
  Muted and Inverted surfaces and the three `action-group` variants; projects
  add their own as `{ label, class }`, plus a `richText` list of Tailwind
  utilities used in rich text. The Layout paragraph renders the `surface` and
  `presentationVariant` props as exactly those classes, so migrated content
  looks the same. `/api/stir/presentation-catalogue` serves the choices' IDs
  and labels for Drupal. Every declared class is compiled.
- `stirTheme.presentation.manifest: false` stops the build fetching the CMS
  presentation manifest, for sites whose content no longer stores free-text
  classes. The build then needs nothing from Drupal.

- `AppHeader`, `MediaVideo` and `EditPresentation` are split into smaller
  parts with unchanged props and output: `MediaVideoBackground` (the hero and
  bare background mode), `EditPresentationLayout` and `EditPresentationFields`,
  and the `header*` helpers in `utils/headerTheme.ts`. These names are now
  auto-imported, so a site that defines a component or helper with the same
  name shadows the layer's.
- `usePageContext().canEditInline(editLink?)` decides whether inline edit
  controls render: `TRUE` when Drupal sent an `editLink` for the entity, or
  the page grants editorial access. `EditableRichText`, `HeroContent` and the
  hero paragraph use it. Drupal still access-checks every save.
- `compliance/site.json` accepts `"prelaunch": true` for sites whose public
  domain still serves the outgoing site. Live page findings become warnings
  prefixed `(pre-launch)`, the audit prints a `PRELAUNCH` line, and the
  outgoing site's copy is no longer used as legal text for disclosure checks.
  Everything else still fails the audit as before. The flag applies to
  `owner.domain` only, so auditing an origin the project already serves with
  `--url` still reports live page problems as errors. Remove the flag at
  cutover.
- `stirTheme.navigation.contentOrientation` sets the desktop header menus'
  dropdown orientation. `'vertical'` stacks child links in a panel under the
  open item; the default `'horizontal'` keeps Nuxt UI's two-column panel.

### Changed

- Every layout field option is now compiled whether or not content uses it
  yet: grid columns 1-12 and gaps 0-20 at every breakpoint, plus each spacing,
  width and alignment option. Before, a value an editor picked for the first
  time had no CSS until the next build. Costs about 0.7 KB brotli on a site
  with typical content, up to about 3 KB gzip on a near-empty one. The
  presentation manifest still supplies free-text classes.

- Plausible's tracker is no longer in the initial bundle (2.4 kB gzip). The
  analytics layer's bridge plugin loads it on demand once tracking is enabled
  and consent allows it, and `@nuxtjs/plausible`'s own client plugin is
  removed. `useTrackEvent`, `useTrackPageview` and `$plausible` behave as
  before; events sent before the tracker arrives are sent once it loads.
- **Editorial access comes from Drupal.** `hasEditorialAccess` reads the
  permission-based `capabilities.editorialUi` from the CE page payload's
  `current_user` and from the auth session (stir-tools contract 1.25.0), or
  editorial local tasks Drupal already access-checked. Role names are no
  longer read. Deploy the stir-tools update first: until a site's Drupal sends
  `capabilities`, administrators lose the tabs bar on Nuxt-only routes.
- Popups now come from the Drupal `popups` block region (`blocks.popups`),
  which replaces the hidden `decoupled` region. `usePopupData` still reads
  `blocks.decoupled` when `popups` is absent, so deploy this layer before the
  Stir Tools update that renames the region. Consumers that read
  `blocks.decoupled` directly should switch to `blocks.popups`.
- **`stir-compliance` checks Webform retention.** When
  `dataHandling.drupalSubmissionRetention` is a day count, every exported
  Webform must purge completed submissions (`purge: completed` or `all`)
  within that many days, or the audit fails. New Webforms default to
  `purge: none`, so set purge on each form before updating.

### Fixed

- **A failed sign-in shows Drupal's reason.** `getFetchErrorMessage()` (and so
  `useAuthLogin`, `useAuthRegister`, `usePasswordRequest`, `usePasswordReset`)
  read only `error.statusMessage`, which is empty over HTTP/2, and a string
  `data.error`, which Nitro sends as `true`. Every failure showed the generic
  fallback, such as "Sign-in failed." twice. It now reads the response body's
  `statusMessage` and `message` first. `throwStirDrupalApiError()` forwards
  Drupal's snake_case `code` on 4xx responses as `data.code`, read with the new
  `getFetchErrorCode()`.
- `useAuthLogin` titles a failure "Couldn't sign you in" with the server's
  message, falling back to "Check your email and password and try again.".
  When Drupal answers `verification_required` (stir-tools login contract), the
  toast offers "Resend verification email", sent through the new
  `POST /api/auth/verify/resend` proxy to stir_account's non-enumerating
  endpoint. The composable also returns `error`, `errorActions`,
  `isResending` and `resendVerification`, and takes `toastErrors: false` for
  pages that show the error inline. The layer's `/auth/login` page now does
  that with a `role="alert"` `UAlert` in the form. Pages that override the
  login page keep the toast and need no change; to show the error inline,
  render the alert in the `#validation` slot and pass `toastErrors: false`.

- The Calendly paragraph loads again. `useScript` adds
  `crossorigin="anonymous"` to every cross-origin script, and Calendly's CDN
  answers every origin with `Access-Control-Allow-Origin: https://calendly.com`,
  so browsers blocked the widget script. `useThirdPartyScript` takes a new
  `crossorigin: false` option that omits the attribute, and the Calendly
  composable sets it. Other third-party scripts keep the stricter default, and
  the allowed-origin check is unchanged.

- `stir-compliance` no longer reports a Webform as storing submitter IPs when
  the form's own `form_disable_remote_addr` is `false` but the site-wide
  `default_form_disable_remote_addr` is on. Webform falls back to the site-wide
  default at runtime, so those forms store no IP.

- **Security.** `/api/auth/session` no longer copies Drupal's `csrf_token` and
  `logout_token` into the client-side `user` object. Nothing on the client
  read them; the Nitro proxy fetches its own token. Other snapshot fields,
  including project additions such as DancePlug's `has_class_access`, are
  unchanged.
- Sign-in, registration and password-request forms no longer resend a spent
  Turnstile token. Drupal verifies the token on every attempt and Turnstile
  tokens are single-use, so once `stir_account` enforced Turnstile on login a
  retry after a wrong password failed verification until the widget's
  250-second refresh. Each composable now clears its token after every
  attempt, and `FieldTurnstile` treats a model cleared by its parent as a
  request for a fresh token. Custom auth forms that use `FieldTurnstile` get a
  fresh token the same way: set the bound token to `''` after submitting.
- Auth and account form fields now resolve their Nuxt UI variant and width
  class the same way the webform layer does: `stirTheme.webform.fieldVariant`,
  then `stirTheme.forms.variant`, and `stirTheme.webform.fieldInput`. The
  password strength field (new, confirm, reset and register passwords) and the
  login/register `UAuthForm` fields previously read only `forms.variant`, so a
  site with `webform.fieldVariant: 'material'` got Nuxt UI's outline input
  there while "Current password" was underlined. Password visibility toggles
  now share the ghost `xs` button, and the current-password toggle exposes
  `aria-pressed`.

- On indexable production builds, `/auth/**`, `/account/**` and `/login` sent
  `X-Robots-Tag: index, follow, …` because the Robots middleware overrode the
  SEO layer's raw `noindex, nofollow` header rules. The SEO layer now declares
  them as `robots: false` route rules, so both the header and the robots meta
  say `noindex, nofollow`.

### Added

- `compliance/REVIEW.md` gains an owner questionnaire
  (`<!-- stir-compliance-owner:v1 -->`) for facts code cannot establish: legal
  entity and trade names, customer locations, mailbox provider, marketing use,
  external tools, provider naming, data clean-up, audience age, billing
  practice, manual accessibility testing, captions, response time, and
  governing law. Existing consumers must run `pnpm exec stir-compliance-init`,
  which inserts the section; until then `audit:compliance` and
  `stir-compliance-init --check` report `REVIEW.md` as outdated.

- `stir-compliance-init --check` reports a missing `compliance/site.json` or
  an outdated `compliance/REVIEW.md` without writing files, and exits non-zero.
  The shared client CI workflow runs it after install, so a layer update that
  adds review checklists fails CI instead of the live audit during deployment.
  **Behaviour change for CI:** client repositories with an outdated
  `REVIEW.md` now fail CI until they run `pnpm exec stir-compliance-init`.

- `useAuthRegister(options?)` accepts `initialState`, `toFields` and
  `validate` for project signup fields and returns them as `state`. The
  register page moved into the `AuthRegister` component, whose `fields` and
  `footer` slots add inputs without forking the form, Turnstile or the
  approval-required state. No options sends the original payload.
- `POST /api/auth/register` now rejects `fields` with base user entity keys
  (`roles`, `status`, `uid`, ...), malformed keys, or nested values, and
  honours an optional `runtimeConfig.stirAuthRegister.allowedFields`
  allow-list. **Behaviour change:** such payloads were previously forwarded to
  Drupal; they now return 400.

### Changed

- **Behaviour change for `presets/minimal` and capability-layer consumers:
  application mode.** A composition without the SEO layer is now never
  indexable, whatever `NUXT_ENV` or `NUXT_INDEXABLE` say. With the SEO layer,
  indexability still requires `NUXT_ENV=production` and
  `NUXT_INDEXABLE !== 'false'`. `@nuxtjs/robots` and the `site` configuration
  (`NUXT_NAME`, `NUXT_URL`, indexability) moved from the platform and SEO
  layers to the foundation layer, which every composition loads.
  - So that standalone capability compositions reach foundation, `editorial`
    and `integrations` (and through it `analytics` and `scripts`) now extend
    `platform`, whose utilities they already import. `listing` and `seo` now
    extend `foundation`. Nuxt de-duplicates layers, so root, full and minimal
    layer order and output are unchanged.
  - Consumers of the minimal preset or of individual layers such as `auth`,
    `webform`, `editorial`, `listing` or `integrations` now serve a real `/robots.txt` with `Disallow: /`,
    `X-Robots-Tag: noindex, nofollow` and a noindex robots meta tag.
    Previously they served none, and `ssr: false` applications returned the
    application shell for `/robots.txt`.
  - A foundation Nitro plugin adds the module's robots meta to client-rendered
    documents.
  - `/sitemap.xml`, `/sitemap_index.xml` and `/__sitemap__/**` now return a
    plain 404 instead of the application shell.
  - A `public/robots.txt` in such projects is moved to `public/_robots.txt`
    at build time and its rules are merged.
  - A read-only website on the minimal preset that must be indexed must now
    also extend `@stir/base/layers/seo/nuxt.config`.
  - Root and full-preset output is unchanged apart from the fix below: indexable
    production `robots.txt`, page headers, and sitemap routes in non-indexable
    environments stay as they were.

  See [Applications](docs/consumer-quickstart.md#applications-not-indexed).
- The compliance audit's "how long submissions are kept" privacy check also
  accepts wording that states a period with kept, stored, held, deleted,
  purged or removed, such as "kept for no more than 24 months" or "deleted
  after 12 months". Wording without a period still fails.
- **Breaking.** Paragraph presentation props now take the structured values
  that stir-tools sends (stir-tools `2da0807b`), not Tailwind class strings:

  | Prop | Before | Now |
  | --- | --- | --- |
  | `width` | Classes, e.g. `"m-auto lg:max-w-4xl"` | Size token: `xs`, `sm`, `md`, `lg`, `xl` or `2xl` |
  | `align` | Classes, e.g. `"md:flex justify-center"` | `AlignConfig`: `{ justify?, items?, text? }`, each `'start'`, `'center'` or `'end'` |
  | `gridClass`, `gridItems` | Classes, e.g. `"grid grid-cols-1 lg:grid-cols-2"` | `GridConfig`: `{ columns?, gap?, matrix? }` keyed by breakpoint |

  Components map them with `resolveWidthClasses`, `resolveAlignClasses` and
  `resolveGridClasses` from `#stir/utils/gridClasses`. For example, width
  `lg` renders `mx-auto lg:max-w-4xl`, without `mx-auto` when
  `align.justify` is `start` or `end`. `WebformProps.align` is now
  `AlignConfig`.

  **Migration:**
  - Release this layer together with a stir-tools version that includes
    `2da0807b`. Class strings from an older Drupal payload are not recognised,
    so paragraphs lose their width, alignment and grid classes.
  - A project that passes layout classes through these props, such as
    `<ParagraphText width="max-w-2xl">`, loses them silently. Put the classes
    on a wrapper element, or pass a size token.
  - Code that reads `gridClass` from page nodes must treat it as `GridConfig`
    and call `resolveGridClasses()`.

### Fixed

- `WebformForm` applies Drupal's structured `width` and `align` through the
  shared helpers. It used them as raw classes, so webforms lost their width
  and alignment.
- `AppHeader` only returns focus to the menu toggle after the menu has been
  opened. With `slideover.unmountOnHide: false`, the closed menu reported a
  leave on first render, which focused the toggle with a visible ring on page
  load.
- `createRegisterValidationSchema()` no longer fails a form that has no
  `display_name` key. Valibot reported it as an invalid key, which blocked
  submission of `/auth/register` and any page reusing the schema.

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
- The SEO layer's `/api/sitemap` source calls a `stir:sitemap:extend` Nitro
  runtime hook so projects can add `images` and `videos` to Drupal sitemap URLs
  without replacing `server/api/sitemap.get.ts`. Handlers run in parallel with
  the Drupal request. Extension entries are validated (absolute http(s) `loc`,
  image and video shapes); invalid entries are dropped with a warning, and a
  handler that throws or exceeds the Drupal request timeout is logged and
  ignored, so the base sitemap is still served. The Drupal payload stays strictly
  validated, and output is unchanged when no handler is registered. See
  `layers/seo/README.md`.
- `/auth/verify` carries a safe same-site `?redirect=` through to its sign-in
  link and post-verification navigation, using the existing
  `safeStirAuthRedirect()` check; `//host` and absolute external URLs are
  dropped. The page logic moved to `useAuthVerify({ fallbackRedirect })`, so a
  project needing a remembered destination overrides the page with a few lines
  instead of copying it. Without `?redirect=`, behaviour is unchanged.
  `AuthSecondaryAction`'s `to` prop now accepts any `RouteLocationRaw`.
- Account navigation is configurable. `app.config` `auth.accountNav.items`
  (`label`, `to`, optional `icon` and `visibility`) replaces the default
  Settings link, and `registerAccountNavVisibility(key, resolver)` decides at
  runtime whether items with that `visibility` key are shown. Both are typed
  and auto-imported. The default navigation is unchanged.
- `useAccountSettings()` returns `reset()`, which restores the last loaded or
  saved values and clears the current password, and
  `emailChangeRequiresCurrentPassword`, a readonly ref reporting whether Drupal
  requires the current password for an email change before any edit. Editable
  field checks are unchanged. Projects that forked the composable for these can
  delete the fork.
- Route hero (#806, #807). `useRouteHero()` resolves a page-level hero model
  (title, title lines, eyebrow, description, actions, image, variant) from the
  current Drupal page's `hero` slot, falling back to the page title and
  metatag description. Explicit heroes come from `definePageMeta({ routeHero })`,
  `stirTheme.routeHero.routes`, or a project resolver registered with
  `registerRouteHeroResolver()`. `RouteHeroSection` renders `cover`, `simple`
  and `overlap` variants with one H1, an eager high-priority image and parallax
  that is inert under reduced motion; `resolveEditorialRouteHero()` builds the
  overlap model for editorial detail pages, keeping playable media in the
  `media` slot rather than behind the hero. `useParallaxStyle()` is also
  exported. Opt in with `stirTheme.routeHero.enabled: true`; the default layout
  then renders `RouteHero` inside `main`, and `node--page` stops rendering its
  inline `hero` slot. Disabled by default, so existing output is unchanged.
  `usePageContext` now shares its Drupal-route check through
  `isDrupalRenderedRoute()`.
- `stirTheme.navigation.actionItems` routes top-level main-menu items, matched
  by title or position, into the header's right region as a button or a
  secondary navigation menu, with `mobile: 'menu' | 'button' | 'hidden'`
  placement in the mobile panel. `navigation.actionsComponent` now also
  receives the resolved `actions`. Default header output is unchanged. When the
  color-mode toggle is hidden, the right region now stays visible on desktop if
  it holds action items or an actions component.
- `popup.hideWhenLoggedIn` (default `false`) waits for the Drupal session and
  keeps the popup hidden for signed-in visitors, with nothing rendered before
  the session resolves.
- The `stir:popup:shown` Nuxt app hook fires with `{ key, popup }` each time
  the popup opens.

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

- `useAccountNav().items` is now a `ComputedRef<NavigationMenuItem[]>` rather
  than a plain array. Templates are unaffected; script code reading the list
  should use `items.value`.
- **Behaviour change: profile validation.** `validateProfileValues()` (used by
  `AccountProfileForm`) is stricter and more precise:
  - email checks apply only to `email` fields and to `link` fields named or
    labelled for email (a leading `mailto:` is ignored). A `string` field whose
    name merely contains "email" is no longer email-validated;
  - other `link` fields must be absolute `http://` or `https://` URLs, so
    values such as `example.com`, `/path` or `javascript:` are now rejected;
  - `cardinality` is honoured: every entry of a multi-value field is checked,
    and more non-blank entries than the cardinality allows is an error
    (`-1` is unlimited);
  - an empty array, or an array of blank entries, counts as missing for a
    required field.
  Forms whose saved values violate these rules will show errors on the next
  save. Projects that forked `profileValidation.ts` for these rules can delete
  the fork.
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
