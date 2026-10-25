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

### Theme

- `DrupalViewDisplay` has a `skeleton` slot, so a site's own grid can show loading placeholders shaped like its cards. Without it, the default skeleton is unchanged.

### Webform

- **New: `webform.wizardPageTitle`.** Classes for a wizard page's heading,
  which otherwise uses `fieldGroupHeader` as before. A site whose stepper
  already names each page can set `sr-only`: the heading stays for screen
  readers, and focus still moves to it on each step.

### Theme

- **Fixed: a View keeps its Drupal spacing when the site renders its own
  grid.** Spacing was applied only through the layer's default grid, so a
  View component using the `#grid` slot lost it. The View's section now takes
  the spacing in that case; Views on the default grid are unchanged.

### Theme

- **Fixed: buttons in an action group line up.** Only the button right after
  a Layout's text got the gap below it, so in a row of buttons the first sat
  lower than the rest. Every button after the text in an action group now
  keeps the gap.

### Theme

- **New: `stirTheme.navigation.ui`.** Nuxt UI NavigationMenu slot classes
  for the header menu only (`{ link: 'uppercase text-lg' }`). Setting
  `ui.navigationMenu` in a site's app config also restyles every other menu,
  the editorial admin menu included.

### Webform

- **Fixed: Back reaches a wizard's chooser page.** A page that moves on when
  its one radio question is answered moved on again as soon as Back showed it
  with its earlier answer; it now moves on only for an answer given there.

### Webform

- **New: `prefill` on the webform paragraph and `WebformForm`.** Values for
  fields Drupal lets the URL fill (`#prepopulate`), applied the same way and
  over the URL's, for a form opened somewhere other than its own page (a
  modal, say).

### Webform

- **New: fields Webform lets the URL fill are filled from it.** An element
  with "Allow the element to be populated using query string parameters"
  (`#prepopulate`) starts with the matching query value, so `?space=12` picks
  a space; a field with options takes only one of them. New
  `applyWebformPrepopulate` util.

### Webform

- **New: Webform flexbox rows render side by side.** Fields in a
  `webform_flexbox` share a responsive grid row (stacked on phones); before,
  the flexbox was flattened away and every field took a full row. Flattened
  fields gain `row`, and `InputType` gains `webform_flexbox`.
- **Changed: `hasLaterWizardPage` takes the form state.** A hidden later page
  counts only while none of the answers its `#states` depend on is given, so once
  a path chooser hides the other path, the last page offers Submit, not Next.
  Callers pass the state as a fourth argument.

### Webform

- **Fixed: an inline confirmation shows the message Drupal resolved for the
  submission.** The submit response's `confirmation_message` (tokens replaced,
  or set by a handler) now replaces the form's static message, which still
  shows when the response has none. New `resolveSubmissionMessage` util.

### Theme

- **Fixed: the hero no longer warns `Slot "media" invoked outside of the render
  function`.** It checked for media during setup by calling the slot; it now
  checks only that the slot is given. Lead-media loading is unchanged.

### Core

- **Fixed: a CMS redirect or HTML answer to a page read no longer crashes the
  page.** A path such as `/anything/index.php/test` made the CMS vhost answer
  with an HTML 307, which the page fetch could not read and the site returned
  500. The Drupal CE proxy now turns a GET/HEAD redirect into a 404, and a 2xx
  answer that is not JSON into a 502 (so a misbehaving CMS is reported, not
  mistaken for a missing page). 304 revalidations, 4xx and 5xx, mutations,
  menu reads and Drupal Redirect-module JSON redirects are unchanged.

### Webform

- **Changed: wizard steps use Nuxt UI's stepper.** A Drupal wizard form shows
  its pages as a `UStepper` with the page titles; steps already passed can be
  revisited, later ones open with Next. The step count is still announced to
  screen readers and the page heading still takes focus. A page offers Next,
  not Submit, while the form declares a later page, even one hidden until an
  answer on this page (a path chooser). New export: `hasLaterWizardPage()`.
- **Added: card radios for options with descriptions.** Radios whose options
  carry a description (Webform's `label -- description`, sent as
  `{label, description}` by Stir Tools) render as Nuxt UI card radios.
  Other radios are unchanged. `WebformFieldProps['#options']` now allows
  `{ label, description? }` values.

### Views

- **Fixed: filters in the URL apply on load.** A View's namespaced filter or
  sort values in the URL (a reload, a shared link, back and forward, or the page
  re-rendering after a filter change) were ignored on the first render, because
  Drupal renders the page with the View's defaults. The View now fetches its
  filtered results on load whenever the URL carries its controls, as it already
  did for a later page. URLs without View controls render as before, with no
  extra request.
- **Fixed: date range filters keep both dates.** A View's `date_range` filter
  was treated as single-valued, so restoring it from the URL or refreshing the
  View sent only the start date and Drupal refused the request. Date range
  filters are now normalised as two-valued (`multiple: true`), so the start
  and end travel together through state, the URL and the refresh request.
  Needs the Stir Tools fix that maps the two values to Views' min and max.

### Webform

- **Added: Webform wizard pages.** A form built from Drupal wizard pages
  (`webform_wizard_page`) now shows one page at a time with a step counter, the
  page title (focused on each step) and Back and Next buttons using the labels
  set in Drupal. Next validates the current page; the last page submits every
  value once. Pages whose fields are hidden by conditions are skipped. Forms
  without wizard pages render exactly as before. Flattened fields carry their
  wizard page as `page`; new exports `resolveWizardPages()` and
  `wizardPageFieldNames()` in `utils/webformWizard`. Requires the Stir Tools
  contract 1.37.0 labels (`#prevButtonLabel`, `#nextButtonLabel`).
- **Added: `stirTheme.webform.fieldComponents`.** Maps a Webform element name
  to a globally registered component that renders that one field inside the
  layer's form field (label, conditions and validation unchanged), for a
  site-specific widget. Unset or unresolved names keep the layer's field.
- **Changed: a URL confirmation follows the URL Drupal resolved for the
  submission.** After a successful submit, `WebformForm` redirects to the
  `confirmation_url` in the submit response when there is one, falling back to
  the form's own redirect as before. Drupal (`stir_webform_rest`) resolves
  tokens in that URL for the saved submission when the site includes
  confirmation settings, so a redirect built from submitted values works. The
  same safety rules apply: only root-relative or HTTP(S) URLs are followed.
  New export: `resolveSubmissionRedirect()` in `utils/webformRedirect`.

### Errors

- **Added: a failed module load names the failing file.** A browser report
  of "Importing a module script failed" or "Failed to fetch dynamically
  imported module" now carries extra data: the site's own `/_nuxt` files that
  came back with an error or no body (file name, status, protocol, time; no
  query string), how many of the site's files used each protocol (h2, h3), and
  the connection type where the browser reports one. Other errors and the
  server reporter are unchanged.
- **Fixed: the browser reports one failure once.** The window, Vue and Nuxt
  each raise the same failure and may wrap it differently (a TypeError, an
  Error, a Nuxt error), which counted as separate errors. The browser now
  counts by message alone, once a minute; the server still counts by name and
  message.
- **Changed: the browser reporter sends only errors from the site's own
  scripts.** An error is reported when at least one stack frame is in the
  site's built scripts (`/_nuxt/`, following the base path and CDN settings).
  Code that other software injects into the page (an in-app browser, an
  extension) and errors with no frames, such as a failed script load or a
  thrown string, are dropped. A failed dynamic import therefore no longer
  reports.
- **Changed: the browser reporter skips automated visitors.** Crawlers,
  page checkers (Lighthouse, PageSpeed, headless browsers) and
  `navigator.webdriver` visitors report nothing, so their failed script loads
  don't create issues.
- **Added: `layers/errors`, error reporting to GlitchTip (Sentry-compatible).**
  Part of the full preset; off until the site sets `NUXT_PUBLIC_ERRORS_DSN`
  (`https://<key>@errors.example.com/<project id>`; optional
  `NUXT_PUBLIC_ERRORS_ENVIRONMENT` and `NUXT_PUBLIC_ERRORS_RELEASE`). Server
  errors with status 500 and up are sent by a Nitro plugin, and uncaught
  browser errors once consent allows non-essential scripts, both with a plain
  `fetch` to GlitchTip's envelope endpoint (path only, throttled; no SDK and
  no new dependency). Name the GlitchTip project after the site's system user
  so the Stir dashboard can match it.

### Theme

- **Added: `useCurrentYear()`.** Returns the copyright year, corrected in the
  browser on mount so a cached page doesn't show last year after 1 January.
  The layer footer uses it; site footers that compute
  `new Date().getFullYear()` themselves should switch to it.
- **Changed: media modal image sizes.** Gallery modal images use a new
  `modal` delivery profile (`sm:100vw lg:1152px`, the modal frame's width)
  instead of `full`, and only the active slide and its neighbours mount
  their media, so opening a large gallery no longer requests every image at
  2560px.
- **Changed: hero fallback colours.** The no-media hero and route hero
  surfaces use the site's `neutral` palette (`from-neutral-900 via-neutral-800`)
  instead of fixed grey, so they follow each site's neutral colour.

### Environment

- **Removed: old environment names.** The build reads only `NUXT_SITE_URL`
  and `NUXT_SITE_NAME`; `NUXT_URL`, `NUXT_NAME` and `SERVER_DOMAIN_CLIENT` are
  no longer read (the development Vite host is the `NUXT_SITE_URL` host, else
  `localhost`). Rename them in any `.env` that still uses them.
- **Added: canonical environment names, old names still accepted.** The build
  reads `NUXT_SITE_URL` (old `NUXT_URL`), `NUXT_SITE_NAME` (old `NUXT_NAME`)
  and takes the development Vite host from the `NUXT_SITE_URL` host (old
  `SERVER_DOMAIN_CLIENT`). The canonical name wins when both are set. Existing
  `.env` files behave exactly as before; runtime overrides are unchanged
  (`NUXT_SITE_URL`/`NUXT_SITE_NAME` were already the runtime names). See
  `docs/runtime-environment.md`.

### Editorial

- **Fixed: the editorial bar no longer shows the last node's tasks on a Nuxt
  page.** Drupal's page data stays in state after a client navigation to a
  page the site builds in Nuxt (for example `/instructors`), so the bar kept
  the previous node's Edit, Delete, Revisions and Unpublished. Page tasks and
  the published state now show only where `route.meta.drupalPage` is true;
  the account menu, Drupal CMS menu and environment badge are unchanged.

### Header

- **Changed: the header publishes its real height as `--ui-header-height`.**
  The fixed header measures its top-of-page (unscrolled) height with a
  `ResizeObserver` and sets it on `<html>`, replacing Nuxt UI's `4rem`
  default, so the no-media hero padding and every
  `calc(var(--ui-header-height)...)` follow header customisation (taller
  padding, larger logo). The scrolled state is ignored, so content does not
  move when the header shrinks. Below `lg`, hero clearance is now the real
  header height plus the old gap. From `lg`, the hero keeps its former fixed
  floor (`7.5rem` hidden hero, `13.5rem` no-media hero) but grows past it when
  the header is taller; sites with a 4rem header look unchanged. Sites that
  hard-coded their own offsets for a tall header can drop them. Optional
  `stirTheme.navigation.height` (a CSS length) is emitted in the server HTML to
  avoid a shift when hydration measures.

### Performance

- **New: `stir-perf` performance audit.** Sites get `pnpm audit:perf`
  (Lighthouse mobile and desktop on `performance.auditRoutes`, against
  per-site budgets), and `audit:site` now includes it. Run
  `pnpm exec stir-compliance-init`: it adds the script, upgrades an unmodified
  `audit:site`, and adds the new "Required performance review" section to
  `compliance/REVIEW.md`, which `pnpm audit:compliance` now requires. Local runs
  need `pnpm add -D lighthouse chrome-launcher` (optional peers) and the
  Playwright Chromium; `PAGESPEED_API_KEY` uses PageSpeed Insights instead.
- **Fixed: the first gallery images were lazy and hidden.** The first row of
  the page's first Media paragraph (and the first slide image of a lead
  Carousel) now loads eagerly, without the reveal animation, with
  `fetchpriority="high"` on the first image, but only when that paragraph
  renders before or inside the page's first Layout section and no route hero
  image or Hero paragraph with media comes first. A gallery lower on the page,
  and every later media paragraph, stays lazy.
- **Changed: masonry galleries are a server-rendered CSS grid.** The
  virtualized `UScrollArea` is gone. Each item's lane (shortest lane first, per
  breakpoint in `masonry.lanes`) and row span (from the image's `width` and
  `height`) are computed on the server, so the layout needs no measuring and
  does not shift after hydration. On a 136-image gallery this removed a 4.4 s
  layout task on mobile and the 0.08–0.14 CLS. Every item is server-rendered;
  items off screen hydrate only as they scroll near (`hydrate-on-visible`).
  The `masonry.gap` applies between lanes and between items in a lane; the
  vertical gap is taken from the bottom of each image, so up to that many pixels
  are trimmed. Media without a size is laid out as 16:9. Galleries with captions
  below, a fixed media height, or non-image/video items use the plain grid.
  Images are sized for the lane width.
- **Fixed: `public/` files had no Cache-Control.** Fonts and images served from
  a site's `public/` directory now get `public, max-age=2592000,
  stale-while-revalidate=86400`; a missing file gets `no-cache`.

### Layouts

- **Fixed: Clear-layout pages without a hero had no h1.** The Clear layout now
  renders the page title (from `useRouteHero`) as an h1 when the page has no
  Hero paragraph. It is `sr-only` by default, so Clear stays visually blank;
  set the new `stirTheme.clearLayout.title` classes to show it. The page's
  `hideTitle` still forces `sr-only`. A page with a Hero paragraph gets no
  extra h1, and with `routeHero.enabled` its hero now renders on Clear instead
  of being dropped. The Link hub layout is unchanged.

### Webform

- **Fixed: date pickers offered dates Drupal then refused.** The date and
  datetime pickers now disable days outside the field's `#dateMin` and
  `#dateMax`, which Stir Tools contract 1.36.0 resolves from Webform's
  `#date_date_min`/`#date_min` and `#date_date_max`/`#date_max` (`today`
  included). Needs a Stir Tools release with that contract; with an older
  one the pickers stay unlimited, as before. `WebformFieldProps` gains
  `#dateMin`, `#dateMax` and `#timezone`, and `parseWebformDateLimit()` is
  exported from `#stir/utils/dateUtils`.
- **Changed: a refused submission shows Webform's messages.** The toast or
  inline error now lists stir_webform_rest's `error.flat` messages, such as
  "… must be on or after 2026-10-14.", instead of "Submitted data contains
  validation errors.", and a message keyed to an element is set on that field.
  `WebformContent` exposes `setErrors()`.

### Security

- **Fixed: protected routes could be bypassed by changing the path's letter
  case or encoding.** Drupal resolves path aliases case-insensitively, but the
  layer matched `protectedRoutes.requireLoginPaths` case-sensitively, so with a
  rule such as `/members/` a request for `/Members/page` (or
  `/api/drupal-ce/Members/page`) skipped both the page middleware and the CE
  payload guard and returned the protected content, without the private
  `Cache-Control` marker. Matching now runs on one canonical form, built by
  `canonicalizeStirProtectedPath()`, in the page middleware, the CE API guard and
  the auth cache-control middleware: decoded once, lowercased with Unicode
  folding, duplicate slashes collapsed, `.`/`..` segments resolved, and `;`
  parameters and trailing dots dropped. Configured rules are now
  case-insensitive, and an exact rule also matches its trailing-slash form.
  **Every site that configures protected routes should update the layer and
  redeploy promptly**, then purge any CDN or Varnish cache that may hold a
  leaked page.

### Tooling

- **Fixed: installing the layer from git no longer fails.** A `prepare`
  script made pnpm refuse the git dependency with
  `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`. It is replaced by
  `pnpm setup:hooks`, which layer contributors run once per clone. Consumers
  need no `onlyBuiltDependencies` entry.

### Theme

- **Fixed: the Tabs paragraph no longer needs the site's
  `app/assets/css/main.css`.** Its scoped style referenced
  `~/assets/css/main.css`, which resolves to the consuming app. The styles
  now sit in its `UTabs` `ui` prop (`content`: `[&_ul]:pt-0 [&_p]:pb-0`;
  `root`: `data-[orientation=horizontal]:overflow-y-clip`), and the
  `div.tab-content` wrapper around the active panel is gone: the panel renders
  straight into the `[data-slot="content"]` element. The `app-tabs` hook is
  unchanged. Site CSS that targeted `.tab-content` inside tabs should target
  `.app-tabs [data-slot="content"]`.

- **Changed: Tailwind 3 class names replaced with their Tailwind 4 forms.**
  Leading `!` important modifiers move to the end (`h-full!`), including the
  default `stirTheme.routeHero.image`; the video "processing" placeholder uses
  `bg-linear-to-br`; the skip link uses `focus-visible:outline-hidden`, which
  keeps an outline in forced-colours mode where `outline-none` removed it.
  Rendering is otherwise unchanged.

- **Fixed: Back after a listing pager click returns to the previous page.**
  `useDynamicListingControls().setPage()` replaced the current history entry,
  so going from page 1 to page 2 and pressing Back skipped page 1. Page
  changes now push a history entry; search, sort and filter changes still
  replace it. Listings must re-sync from the route (`syncFromRoute()` on route
  change) to follow Back.

- **Changed: a facet with one option stays enabled when that option would
  narrow the results.** `useDynamicListingControls().isFacetDisabled()` used to
  disable any unselected facet with one option or none. Filter option rows may
  now carry an optional `count` (results with that value under the other active
  filters), and the composable takes an optional `totalItems` (results under
  the current filters). When both are present, a lone option is disabled only
  if its `count` reaches `totalItems`. Without them, behaviour is unchanged.
  Pass `totalItems` from the listing pager once the backend sends counts
  (Stir Tools `LightweightListingHelper::addCountsToOptions()`).

- **Changed: footer menu links are no longer underlined.** `stirTheme.footer.footerLinks` now styles only the footer menu (the NavigationMenu `link` slot) and defaults to empty, so Nuxt UI styles it. The underline was clipped by Nuxt UI's truncating label at some widths, and WCAG 1.4.1 does not require one in a navigation list. The new `footerInlineLinks` key styles links inside footer text (email, copyright, credit) and keeps the underline and darker shades. A site that overrides `footerLinks` but not `footerInlineLinks` keeps its colours on the inline links, with an underline added; before this fallback, such sites (styled for a dark footer) got the layer's dark `text-primary-800` inline links and failed contrast. Set `footerInlineLinks` to style inline links separately.
- **Changed: `StirPdfViewer` requires vue-pdf-viewer-core 0.4.0.** Sites that
  install the viewer must update it (`pnpm add vue-pdf-viewer-core@^0.4.0`).
  The library now names the viewer, pages region and toolbar from the document
  title ("<title>, PDF document viewer", "<title>, PDF pages", "<title>, PDF
  viewer toolbar"), so pages with several viewers pass axe `landmark-unique`,
  and it keeps its sticky toolbar inside the viewer's stacking context so it no
  longer covers the site header. `StirPdfViewer` passes its `title` through and
  maps `--stir-pdf-toolbar-offset` (default `--ui-header-height` plus the
  editorial tabs bar) to the library's `--lpv-toolbar-offset`; the layer's DOM
  label rewriting and stacking overrides are removed. On an older library the
  titles are ignored and the toolbar can again cover the header.

- **Changed: carousel accessible names and focus.** `paragraph-carousel` no
  longer exposes its paragraph ID in `aria-label`. It uses an optional new
  `header` prop when Drupal sends one, otherwise "Carousel" (or "Slideshow"
  for fade mode), numbered by page order when several share a name. The
  carousel region now shows a primary `focus-visible` outline, and the pause
  control on fade slideshows reads "Pause slideshow". Tests matching the old
  "Content carousel <id>" label need updating.

### Foundation

- **New: pages live in Varnish as long as their shortest Drupal response.**
  A public page built from several Drupal responses (page, menus, views, app
  context, SEO) now sends `Cache-Control: public, max-age=60, s-maxage=<N>`,
  N being the smallest `s-maxage` among them; Stir Tools sets each from the
  content's own lifetime or the site's settings. Responses without one leave
  the choice to the rest, or to Varnish's default. Private responses are left
  alone. Needs Stir Tools sending `s-maxage`; until then nothing changes.

### Foundation

- **New: pages carry Drupal's cache tags for Varnish.** Server-rendered HTML
  and the Drupal API responses this layer proxies or serves (`/api/drupal-ce`,
  `/api/menu`, `/api/app-context`, `/api/view/*`, `/api/listings/*`,
  `/api/seo/global`) now send `X-Cache-Tags`: the union of the cache tags of
  every Drupal response the page was built from, space-separated, at most
  3,000 bytes (over that, per-entity tags give way to `stir:oversize`). The
  Nuxt Varnish stores them and Stir Tools purges by tag, so editing content
  purges exactly the pages that showed it. Private responses send none. A new
  Nitro plugin wraps each request's own `$fetch` to collect the tags of
  internal requests, and `x-cache-tags` joins the Drupal CE pass-through
  headers. Needs Stir Tools sending `X-Cache-Tags` (until then nothing is
  sent) and the Nuxt VCL that strips it before browsers. No consumer change.

### Editorial

- **New: Drupal's administration menu in the editorial tabs.** For accounts
  Drupal gives the `adminMenu` capability (`access administration pages`),
  **Drupal CMS** opens a left panel of Drupal's administration sections, one
  open at a time, each with its pages; every link opens Drupal with a way
  back. The sections load the first time the panel opens, through the new
  server route `GET /api/admin-menu` (forwards the session to Stir Tools'
  `/api/auth/admin-menu`). Needs Stir Tools with contract 1.34.0; other
  editors and older Stir Tools keep the dashboard link. Syncs Stir Tools
  contract 1.34.0. `usePageContext()` gains `hasAdminMenuAccess`.
  The panel uses the editorial admin scope, so a site's theme does not restyle
  it.

### Theme

- **Fix: links in rich text take the link colour again.** The prose link
  rule (`base.css`) used `:where(a)`, which has no specificity, so Tailwind's
  preflight `a { color: inherit; text-decoration: inherit }` in the same layer
  won and links looked like body text. Rich-text links now show in the primary
  colour with a darker hover colour, and no underline. Content marked
  `.not-prose` (an address, a card) and links with their own utility classes
  keep their own styling. A project whose link colour is close to its text
  colour (under 3:1, so colour alone does not mark a link) turns the underline
  on with `--stir-prose-link-decoration: underline` in its CSS.

### Environment

- **New: an environment badge in the editorial tabs.** On a build whose
  `NUXT_ENV` is not `production`, the editorial tabs show a "Development" (or
  "Local", "Staging") badge in the theme's error colour beside Drupal CMS (or
  the editor's name when there is no dashboard link), like `stir_env`'s Drupal
  admin bar. It uses the 700 shade so the small white text keeps 4.5:1
  contrast. Only editors see the tabs, so clients
  reviewing a development site never see it. Production builds show nothing.
  `NUXT_ENV` unset counts as development, the same rule that already keeps such
  builds out of search, so check production builds set `NUXT_ENV=production`.
  The value is exposed as `runtimeConfig.public.environment`.

### Header

- **New: `stirTheme.navigation.desktopBreakpoint`.** The header switches from
  the menu button to the desktop menu at `'lg'` (1024px, the default, so
  existing sites are unchanged). Set `'xl'` to keep the menu button until
  1280px when a site's menu and actions do not fit on one line at 1024px.

### Images

- **Changed: `/_ipx` image processing is bounded.** A burst of uncached sizes
  ran every transform at once and could push a site over a 1GB pm2
  `max_memory_restart`. With no configuration needed, the theme layer now runs
  at most 2 IPX transforms at a time (others queue), turns off the libvips
  cache, uses one libvips thread per transform, clamps output to 3840px and
  refuses masters over 40MP. On a staging gallery of 136 photos, a cold burst
  peaked at ~1,024MB before and ~600MB after. 4 at a time halved the cold time
  but peaked at ~850MB, too close to the 1GB limit with SSR traffic on top, so
  the layer stays at 2. Cache headers on successful images are
  unchanged. `sharp` is now a direct dependency.

### Layout

- **Fixed: a Layout's vertical Align did nothing.** Align top/center/bottom
  (`align.items`) now adds `items-start|center|end` to the Layout's grid, so a
  short column (or grid item) aligns against the tallest one. Text and
  horizontal alignment are unchanged, and a Layout without a vertical Align
  renders as before. Layouts already saved with a vertical Align will change
  appearance on deploy.

### Webform

- **Fixed: a required multiple field demanded every slot.** A required date
  with `#multiple: 3` needed all three dates, though Webform requires only one
  value of a required multiple element. Required now means at least one value,
  and `#multiple` caps how many. (Webform's `multiple__min_items` only sets how
  many empty rows its own form shows, so it is not a minimum.)
- **Fixed: an empty required select blocked submit with the browser's
  tooltip.** A required select marks its hidden native select required, and
  the browser checked that before the form's own validation ran, so no inline
  errors showed. The webform now sets `novalidate`: controls stay marked
  required for assistive technology, Nuxt UI validates every field, and each
  shows its inline error with the `#required_error` set in Drupal.
- **Changed: a number field takes the form's floating labels.** With
  floating labels on, its label rests on the control's border, as a select's
  and a date's do, instead of standing above it; the steppers stay at the
  control's ends. It also announces `aria-required` like other inputs.

### Auth

- **Added: the protected page's button label comes from Drupal.** It was fixed
  as "Continue". It now reads `protectedPage.submitLabel` from
  `/api/auth/config`, as login and register read theirs, and falls back to
  "Continue". Set it as **Protected page submit label** in the Stir Account
  settings; needs Stir Tools contract 1.33 (synced here).

### Validation

- **Fixed: an invalid form jumped to its first error instead of scrolling
  smoothly.** Focusing the field made the browser jump to it, so the smooth
  scroll had nothing left to do. The field is now focused without scrolling,
  and the smooth scroll brings it into view.

### Button

- **Fixed: a document button ignored the editor's link text.** A Button
  paragraph with a PDF showed the media's title, so the link text only showed
  when the media had none. The link text now labels the button and the PDF
  viewer's heading; the media's title fills in only when the link text is
  empty, so editors can keep their file names for the media library.

### Calculator

- **Changed: the calculator loads its widget from site configuration, never
  from content.** Editors choose only the venue; the paragraph's Embed URL is
  ignored. A site that uses the calculator commits the production loader in
  `nuxt.config.ts` (`runtimeConfig.public.calculator.loaderUrl`), and staging
  and local environments override it with `NUXT_PUBLIC_CALCULATOR_LOADER_URL`.
  A production build (`NUXT_ENV=production`) fails if that variable is set,
  so a copied staging value cannot go live. The per-paragraph API origin
  override and `thirdPartyScripts.allowedOrigins.calculator` are removed.
  **Action:** a site using the calculator paragraph sets the loader in its
  `nuxt.config.ts`, removes `allowedOrigins.calculator` from its
  `app.config.ts`, and sets the variable on staging and local, in the same
  change that takes this release.

### Privacy

- **This repository is public, so it no longer names client sites.** The
  consumer audit's target list moved to the private ops repository: run
  `pnpm audit:consumers` with `STIR_CONSUMER_TARGETS` pointing at it. Tests,
  docs and examples use neutral names, and a check fails on any client name.
- The video player debug switch is `localStorage['stir:video-player-debug']`.

### Webform

- **Fixed: an empty number field showed its minimum as if it were entered.**
  A number with `#min` and no `#placeholder` used the minimum as placeholder
  text, so a required guest count looked like "1" while still empty, and
  visitors thought they had answered. The field now shows only the placeholder Drupal
  sets.

### Dependency security

- **Refresh sharp to 0.35.5 in each site's lockfile.** sharp ships in the
  production server through `@nuxt/image`'s IPX provider, and 0.35.4 bundles a
  vulnerable librsvg (GHSA-wq5f-xc86-pv6w). The layer's lockfile now resolves
  0.35.5, but a site resolves its own: run
  `pnpm update sharp shell-quote @modelcontextprotocol/client`, which stays
  inside the existing ranges and also clears GHSA-pqg4-j6r4-53mv and
  GHSA-6qxp-vccf-f47h (dev-only).
- **pnpm overrides in the layer do not reach sites.** To clear the dev-only
  simple-git and undici alerts, add these to the site's `pnpm-workspace.yaml`:

  ```yaml
  overrides:
    simple-git@3>@simple-git/argv-parser: 2.0.1
  ```

  A site that uses release-it should move to release-it 21, which brings in the
  patched undici, rather than overriding it.

  Do not override `simple-git` itself to v4: `@nuxt/devtools` 3.4 default-imports
  it, and v4 removed that export. The argv-parser override fixes
  GHSA-v5rq-49vh-5v5c; the remaining simple-git 3 advisories need a devtools
  release on simple-git 4. `braces` 3.0.3 and `node-forge` 1.4.0 have no patched
  release yet; both are build and dev-server only and absent from `.output`.

### Rich text

- **Document links embedded in rich text sit on their own line and follow the
  embed's alignment.** Stir Tools now renders document media as
  `<drupal-media data-media-type="document">` holding a download link. The
  layer shows the wrapper as a block, and a centred embed centres its link
  directly under the media above it. Needs no Stir Tools update to be safe:
  without it, no document wrappers exist.

### Nuxt Image

- **Fixed: IPX errors were cached for a year.** The `/_ipx/**` route rule sent
  `public, max-age=31536000, immutable` on every response, and IPX sends no
  `Cache-Control` of its own on errors, so a 404, 403 or 400 kept that header.
  A pull CDN (Bunny, Cloudflare) or a browser could then keep a broken image
  until a manual purge. The route rule now sends `public, max-age=60`, which
  only errors keep: a resized image still gets IPX's own header, which repeats
  the source file's max-age (ten years from Drupal's file host), unchanged.
  Already cached errors still need one purge of `/_ipx/` on each zone.

### Nuxt 4.6

- **Changed: error pages render inside the failed request**
  (`experimental.inlineErrorRendering`). Nuxt no longer re-enters the server
  through `/__nuxt_error`, so an error page keeps the headers and cookies the
  failed render had set. Middleware and route rules do not run a second time,
  and `render:html` sees the original request: a 404 page now carries the
  robots meta tag, as well as the `X-Robots-Tag` header it already had.
  Status codes and the maintenance page's `Retry-After` are unchanged. Nitro's
  error handler, which inline rendering bypasses, set `Cache-Control: no-cache`.
  The layer now sets it on any HTML error response that has no cache
  directive, and leaves a private page's `private, no-store` alone. A site
  that sets `experimental.inlineErrorRendering: false` keeps the old path.
- **Breaking: the layer now requires Nuxt 4.6 and Node.js
  `^22.22.3 || ^24.15.0 || >=26`.** `nuxt`, `@nuxt/kit` and `@nuxt/schema`
  move to `^4.6.0`, so the layer can adopt 4.6-only APIs such as
  `nuxt/server`. Before updating `@stir/base`, put every build and deploy
  host on a supported Node version. Then update the site's Nuxt with
  `pnpm update nuxt --latest`, or `npx nuxt upgrade --dedupe`, and commit
  the lockfile. Nuxt 4.6 loads `nuxt.config` as an ES module, so a site config
  that uses `__dirname` fails `nuxt prepare`. Resolve paths with
  `fileURLToPath(new URL('./path', import.meta.url))` instead.
- **Changed: the dev server refuses an unknown `Host`.** `@nuxt/cli` 4, which
  ships with Nuxt 4.6, answers `Forbidden: this host is not allowed` on its
  own pages (loading screen, error report) when the request's `Host` is not
  one it listens on. In DDEV, nginx proxies `nuxt.<project>.ddev.site` to the
  dev server, so start it with `nuxi dev --public`: in the project's
  `ecosystem.config.js`, `args: 'dev --public'` (stir-decoupled a3ced4d6).
- **Removed:** `useDrupalViewControls` no longer re-exports the
  `ExposedFilter` and `ExposedSort` types. Nuxt 4.6 auto-imports them from
  `app/types`, and the second export made `nuxt prepare` warn that each was
  imported twice. No audited site imported them from the composable. A site
  that did should import them from `#stir/types/View`.
- **Fixed: a site on Nuxt 4.6 failed `nuxi typecheck`.** Nuxt 4.6 stopped
  bridging `nuxt/schema` and `@nuxt/schema` ([nuxt/nuxt#36186](https://github.com/nuxt/nuxt/pull/36186)),
  so the layer's `AppConfig` augmentations no longer reached `useAppConfig()`.
  Sites then saw only the types Nuxt infers from the `app.config` files:
  `stirTheme`, `auth`, `popup` and the other layer keys lost their declared
  types (`Property 'accountNav' does not exist on type '{}'`, implicit `any`
  indexing). The layer now augments `@nuxt/schema`, which Nuxt 4.6 names as
  the one surface to augment. A site that augments `AppConfig` or
  `AppConfigInput` in `nuxt/schema` itself should move to `@nuxt/schema` too.
- **Fixed:** the generated `stir-app-config.d.ts` type template now references
  the layer's declaration file instead of copying it into `.nuxt/types`.
  In the copy, relative imports such as `RouteHeroVariant` did not resolve.
  The layer's `app.config` types now constrain a site's `app.config` for the
  first time. A key the layer does not read can therefore fail typecheck.
- **Changed:** route hero class keys (`stirTheme.routeHero.*` other than
  `image`, and each variant's keys) accept a list of classes as well as a
  string. `routeHero.variants` accepts a site's own variant names alongside
  `cover`, `simple` and `overlap`. `stirTheme.carousel.root` also accepts a
  list. The runtime already did all three; the types now match.

### Webform

Requires nothing new from Drupal; with Stir Tools contract 1.32 (which sends
`#conditions`, every composite's parts, resolved option sets and likert keys),
every element family renders and submits correctly. Older payloads are adapted
at the boundary.

- **Fixed: conditions never matched snake_case fields.** Custom Elements sends
  `#states` selectors camel-cased (`eventType`), which named no field, so a
  field shown or required by another field's value never appeared. Conditions
  are now read from `#conditions` (or rebuilt from `#states` against the form's
  names) and evaluated as Webform evaluates them: all states (`invisible`,
  `required`, `optional`, `enabled`…) and all triggers (`checked`, `filled`,
  `!value`, `pattern`, `between`…), with `and`/`or`/`xor`. A conditionally
  required field is now required in the browser too.
- **Fixed: element types without a component rendered an empty label and
  blocked the form when required.** Aliases now resolve to their family
  (`webform_checkboxes_other`, `webform_toggles`, `webform_buttons`,
  `webform_rating`, `webform_scale`, `webform_terms_of_service`,
  `webform_email_confirm`, `webform_time`, `url`…); anything else is reported
  with `console.error` and left to Drupal.
- **Added:** every composite (name, contact, link, telephone, custom) renders
  its parts through `FieldComposite`; likert (`FieldLikert`); several values
  for a `#multiple` text input (`FieldMultiple`), up to its cardinality; a
  multiple select; searchable selects for long lists.
- **Fixed: composite and multiple values had the wrong shape.** A composite
  that takes several values is submitted as a list of rows, and a multiple
  text field as a list.
- **Fixed: a required composite required every part.** Webform enforces only
  each part's `#required`; the composite's own is display only.
- **Fixed: upload limits were never applied in the browser.** `#fileExtensions`
  and `#maxFilesize` arrive camel-cased; a bare `#maxFilesize` is megabytes,
  as in Webform.
- **Fixed:** a required select now announces `aria-required`.
- **Changed: numbers are bounded only by Drupal's `#min` and `#max`.** The
  browser no longer refuses values below 1 when the element sets no `#min`.
  **Action:** a site that relied on that floor sets `'#min': 1` on the element
  in Drupal (and on production for any webform kept out of config sync)
  before taking this release.
- **Removed:** `useEvaluateState`, `evaluateCondition`, `getNestedStateValue`
  and `matchesCondition`. Use `resolveWebformFieldStates` from
  `#stir-webform/utils/webformConditions`. No site used them.
- **Added:** `createWebformState` (`#stir-webform/utils/webformState`) builds
  the form's values in Webform's stored shapes; `FieldRenderer` takes an
  optional `formName` (validation path) for nested fields.

### Security

- **Protected-page content is now refused without access at the server.**
  The auth layer copies `protectedRoutes` from `app.config.ts` into the server
  runtime config at build time, but Nuxt had already handed Nitro its own copy
  of the runtime config, so every server build kept `requireLoginPaths: []`.
  The page route still redirected to `/auth/protected` (that check runs in the
  browser bundle), but the page's content at `/api/drupal-ce/<protected path>`
  was served to anyone, marked public, and could be cached by Varnish. The
  layer now also writes the resolved routes onto the Nitro instance, so the
  server boundary gates them. **Action:** rebuild and redeploy every site that
  sets `protectedRoutes.requireLoginPaths`, then purge Varnish.
  `allowAuthenticatedUserBypass` now also reaches the server; unset, it
  defaults to `true` as documented, so signed-in Drupal users keep access.
- A private SSR child payload appended to an already private page no longer
  repeats the directive: the page's `Cache-Control` stays exactly
  `private, no-store, max-age=0`.

### Changed

- **Drupal pages choose their layout in route middleware in the browser too,
  before the page renders.** On the server this was already so; in the
  browser `Drupal/PageRoute.vue` set the layout from a watcher once its
  payload loaded, so the layout changed after the page had started rendering.
  On a signed-in first load (rendered in the browser) of a page whose
  `page_layout` is not `default` (`clear`, `links`, a site's `clients`), the
  page mounted in `default`, was remounted in its own layout and fetched
  Drupal twice: one Drupal round trip slower, and the same mid-load remount
  that left a site on the loader. A late write could also land on whichever
  route was current by then. `plugins/drupalPageLayout.client.ts` now fetches
  the page (importing the Drupal CE client lazily, so the initial bundle does
  not grow) and sets `to.meta.layout`; the page's `fetchPage()` reuses that
  payload once through `pageFetchOptions()` (`serverPageFetchOptions()`
  remains as a deprecated alias), so Drupal is asked once per navigation, and a
  refresh still refetches. PageRoute no longer writes the layout.
  What a consumer can notice: on client navigation the address bar changes
  when the next page is ready rather than at the click (the loading bar runs
  meanwhile); on a signed-in first load the layout's own requests (menus, app
  context) start after the page request rather than beside it; a page Drupal
  answers with an error is requested twice, so PageRoute can report it. A
  Drupal page that names its layout in `definePageMeta` now keeps it (the
  server overrode it before). PageRoute's `forcedLayout` prop no longer sets
  the layout, which it never did on the server: use
  `definePageMeta({ layout })`. No consumer change is needed otherwise. Both
  layout plugins are named `stir:drupal-page-layout`: a site that maps the
  layout per navigation (such as a member app shell) registers its own route
  middleware in a plugin with `dependsOn: ['stir:drupal-page-layout']`, so it
  runs after the Drupal page's layout is set.

- **The account settings page names its layout in page meta** (`layout:
  'account'`) instead of rendering `<NuxtLayout>` itself. With app.vue's
  persistent `<NuxtLayout>`, a page that renders its own layout relies on the
  app-level one switching off at exactly the right moment, and a late switch
  shows two site shells until a refresh. `tests/utils/layoutContract.spec.ts`
  now fails if a layer page renders `<NuxtLayout>`, or if a layout or shell
  makes the page slot conditional or renders it twice: moving the page to a
  new parent while a browser-rendered (signed-in) first load is pending leaves
  it on the loader. **Action for consumers:** replace `layout: false` plus an
  in-page `<NuxtLayout name="…">` with `layout: '…'` in `definePageMeta`, or set
  `to.meta.layout` in route middleware when it depends on state.

- **One place maps Drupal errors: `createStirDrupalUpstreamError()` in the
  foundation layer.** Client errors keep their status, a 503 (Drupal's
  Maintenance mode) stays a 503 carrying Drupal's message as
  `data.maintenanceMessage`, and anything else becomes a 502. The listing,
  paragraph-view, editorial and Webform routes use it in place of their own
  copies, and `throwStirDrupalApiError()` now passes a 503 on the same way
  instead of a 502, so auth, account and project routes built on it show
  maintenance too. `readStirDrupalMaintenanceMessage()` is the single check
  that a 503 body is a message and not an HTML page (Drupal's themed page, or
  a proxy's while Drupal is down); `useStirErrorPage()` no longer repeats it.
  Pairs with Stir Tools declaring `_format: 'json'` on its JSON routes, which
  makes Drupal send its maintenance message as plain text on every one of
  them; with an older Stir Tools, pages show the configured wording instead.
- **`throwStirDrupalApiError()` shows users only Stir's `error` field.** Once
  Drupal answers JSON routes' errors as `{"message": ...}`, that text could
  name permissions or tokens ("X-CSRF-Token request header is invalid"), so
  `message` is no longer read. Drupal controllers that want to show users a
  reason return it as `error`, as `stir_account` does.
- Drupal's Maintenance mode now covers every page, not only Drupal pages. The
  app-context route passes Drupal's 503 on (other failures still degrade to
  an empty context), `useAppContext()` then shows the maintenance error for
  the whole page, and the listings route passes a 503 through instead of
  turning it into a 502. Pages Nuxt builds itself show
  `stirTheme.error.maintenance.message`, because Drupal answers those
  requests with its HTML maintenance page rather than the plain message.
  Nothing in Drupal changes.

- The error page treats a 503 as planned maintenance, because Drupal answers
  503 while its Maintenance mode is on: it shows Drupal's maintenance message
  (passed through the page fetch as `error.data.maintenanceMessage`) under the
  `stirTheme.error.maintenance.title`, with `maintenance.message` as the
  fallback (defaults "Back shortly" / "We are making some improvements…"),
  sends `Retry-After` and hides the clear button. 502 and 504 keep "Content
  service unavailable". Projects that override `error.vue` should do the same.

- Popup drawer now shows its title in UDrawer's header row next to the close
  button (the description stays `sr-only`); modal unchanged. Site popup bodies
  can drop their own drawer heading. New `popup.title` app config sets the
  title when the webform has none (webform title → `popup.title` →
  `'Announcement'`), which also names the modal.
- Popup drawer (`mobilePresentation: 'drawer'`) now keeps UDrawer's default
  `gap-4 p-4` padding, uses its own `popup-drawer` class hook instead of the
  modal's `popup` (site `.popup` sizing no longer pulls the sheet off-edge),
  and replaces the modal's corner close button with UDrawer's standard header
  close. Sites can drop drawer padding/close workarounds.

### Added

- `useStirErrorPage(error)` holds the error page's logic: it classifies an
  error (`notFound`, `maintenance`, `backend`, `generic`), returns its title
  and message, shows Drupal's maintenance message for a 503 and sets
  `Retry-After`. Wording for each kind can be set under `stirTheme.error`. A
  project that overrides `error.vue` for its design should call it instead of
  repeating the logic.

- Popup: opt-in `popup.mobilePresentation: 'drawer'` renders a bottom
  `UDrawer` below `md`, and the popup body component receives a
  `presentation` prop (`'modal' | 'drawer'`). Optional phone trigger via
  `popup.mobileTrigger` or the paragraph field `field_popup_mobile_trigger`
  (`popupMobileTrigger`; the field ships in Stir Tools contract 1.30.0 —
  run `drush updb` on the Drupal site).
  Defaults keep today's modal and trigger.

### Fixed

- `useStirSiteName()` read `useRuntimeConfig()` inside its computed, which can
  first run after the Nuxt context has gone. With Drupal unavailable (for
  example in Maintenance mode) the error page itself then threw, and visitors
  got a bare 500 instead of the 503 page.

- **Behaviour change.** Popup `popupDelay` and `popupThreshold` are now read
  when Drupal sends them as strings (`"5000"`, `"0.25"`), which is how the CE
  payload serialises them. Sites whose configured delay or threshold was being
  silently ignored will now see it apply. On phones (below `md`) an `exit`
  trigger now behaves as `scroll` instead of `delay`.

### Removed

- **Behaviour change.** Section headings now come only from the Layout
  paragraph. The Carousel, Media and Accordion paragraphs no longer render
  their `field_header` (`header` / `headerTag`); item headings (accordion
  items, tabs, features, timeline items, the hero) are unchanged, and the
  Accordion's intro text still renders. **Migration:** wrap a carousel,
  media or accordion that shows a heading in a Layout paragraph and move the
  heading to the Layout's `field_header`; section spacing and heading styles
  follow the Layout too. Across the Stir sites this affected four paragraphs,
  all on one site. Drupal still sends `field_header` until Stir Tools removes
  it; the layer ignores it.

- **Breaking.** The CMS presentation manifest and free-text classes are gone.
  Every site now styles paragraphs with Surface and Variant choices, so builds
  compile the layout vocabulary plus the project's catalogue and `richText`
  utilities and fetch nothing from Drupal. For a site that already set
  `presentation.manifest: false`, the generated CSS is byte-identical.
  - `stirTheme.presentation.manifest` is removed from the app config type.
  - `STIR_PRESENTATION_MANIFEST`, `STIR_PRESENTATION_MANIFEST_API_KEY`,
    `STIR_PRESENTATION_MANIFEST_LAST_KNOWN` and
    `STIR_PRESENTATION_MANIFEST_FIXTURE` are no longer read; the shared client
    CI stops setting the fixture.
  - `build/presentationManifest.ts` is replaced by `build/presentationSource.ts`,
    and the presentation-usage manifest contract is no longer shipped.
  - Paragraph `Layout` and `Text` no longer fall back to a payload `classes`
    value, and `toEditableRichTextProps()` no longer copies one.
    `resolvePresentationClasses()` takes the catalogue and choices only.
  - Public runtime config drops `stirPresentationManifestRevision`, and
    `stirPresentationBuild` keeps `sourceRevision`, `utilityCount`,
    `sourceBytes` and `generationDurationMs`. `/api/health` returns
    `presentation: { sourceRevision }`.

  **Consumer action:** delete `manifest: false` (and its comment) from
  `stirTheme.presentation` in `app/app.config.ts`; typecheck fails until it is
  gone. Remove any `STIR_PRESENTATION_MANIFEST*` variables from `.env` files and
  CI. Take the stir-tools release that removes `field_classes` in the same
  rollout.

- **Breaking.** `usePageContext().isAdministrator` and the `isAdministrator`
  field of `resolveDrupalPageAccess()` / `mergeDrupalPageAccess()` are gone.
  They string-matched the `administrator` role, which Drupal never uses to
  decide access. Use `hasEditorialAccess` for editorial chrome and
  `canEditInline(editLink)` for inline edit controls.

### Added

- Surfaces can be cards: `card: true`, or a Text card's variant (`'outline'`,
  `'solid'`, `'soft'`, `'subtle'`). A Layout on a card surface renders in the
  theme card with its gradient; a Text paragraph renders in a Nuxt UI card.
  This replaces the Card and Card style fields, which keep working until a site
  runs the Stir Tools migration. **Consumer action (sites using cards):** add
  card surfaces to `stirTheme.presentation.surfaces` before taking the Stir
  Tools release: `card` (`card: true`), `<surface>-card` for each surface used
  together with Card (same class plus `card: true`), and `<style>-card` for
  each Text card style other than outline.

- Presentation choices take `colorMode: 'dark'`. A surface or variant that sets
  it gets the `dark` class, so Nuxt UI's colour tokens and `dark:` utilities
  switch inside it, instead of `dark` being typed into its class string (which
  keeps working). `.dark` now also sets `color-scheme: dark`, so native
  controls such as date pickers and scrollbars match dark pages and sections.

- `stirTheme.embedded` (default `false`): an app embedded in another site,
  such as a calculator widget, renders only its layout and page. The
  skip link, route announcer, loading indicator, scroll-to-top button, popup,
  privacy notice and client components are left to the host page. Set it at
  runtime with `updateAppConfig({ stirTheme: { embedded: true } })`.

- The protected page gate renders `stirTheme.auth.secondaryAction` (or
  `auth.pages.protectedPage.secondaryAction`) under its form when a label and
  destination are set, e.g. an enquiry link. By default it shows nothing,
  since the gate has no login to fall back to.

- `stirTheme.auth.chrome` (`'none'`, `'header'` or `'full'`, default
  `'none'`) renders auth pages inside the site layout with the site header,
  or the header and footer. `stirTheme.auth.pages.<key>.chrome` overrides it
  per page. With chrome, the layout owns `<main>`, the auth page fills the
  screen under a fixed header (or below a sticky one), and a full-bleed
  background carries the `auth-background` class, so a site can style the
  header over the photo. `layouts/default.vue` accepts `footer: false` and
  provides its header mode as `stirHeaderMode`; a project that overrides that
  layout should `provide('stirHeaderMode', useHeaderMode())` too, or auth
  pages size themselves for a fixed header. The auth layer still works
  without the theme layer.
- `stirTheme.navigation.toggleVariant` and `toggleColor` set the Nuxt UI
  variant and colour of the menu toggle and the slideover close button
  (default `ghost` and `neutral`), so a site can use `link` over a hero image
  instead of overriding hover and focus states with classes.

- `stirTheme.navigation.desktopLayout: 'toggle'` keeps the menu toggle and
  slideover at every breakpoint, on the side set by `toggleDirection`, and
  renders no inline desktop menu. `stirTheme.navigation.brand: false` removes
  the logo and site title from the header in any layout, without the
  site-title fallback that `logo: false` gives. Existing layouts are
  unchanged.
- The slideover's close button no longer takes the header's right-region
  classes, so it stays visible from `lg` up when colour mode is forced or its
  toggle is hidden. Only sites that show the slideover on desktop could see
  the missing button.
- `stir-compliance` detects Calendly from the Calendly paragraph module or its
  paragraph type, and then requires Calendly in `technology.vendors` and the
  Privacy Policy (or `technology.inactive.calendly` with the reason). Sites
  without the paragraph are not asked about it.
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

- The hero's header clearance follows Nuxt UI's `--ui-header-height`.
  `stirTheme.hero.hide` and `hero.noMediaSpacing` are now the header height
  plus a gap, so a site that changes `--ui-header-height` keeps the right
  space. At the default 4rem they equal the old `pt-15 lg:pt-30` and
  `pt-20 lg:pt-54` exactly. Sites that override either value are unchanged. A
  site whose `--ui-header-height` is not a length (for example `auto`) and uses
  the default must set its own values, because an invalid `calc()` drops the
  padding.

- **Behaviour change:** the site layout persists across navigations. `app.vue`
  renders one `<NuxtLayout>` around `<NuxtPage>`, so the header, footer and
  other layout components keep their DOM (and state) between pages that share
  a layout, instead of being rebuilt on every click. Drupal pages choose their
  layout before render: `plugins/drupalPageLayout.ts` reads `page_layout` on
  the server (pages opt in with `definePageMeta({ drupalPage: true })`, as
  `[...slug].vue` does), and `Drupal/PageRoute.vue` sets it on client
  navigation. Auth chrome is set by `middleware/authChrome.global.ts`.
  **Consumer action:** a site page that renders its own `<NuxtLayout>` must add
  `definePageMeta({ layout: false })`, and so must a page that should stay
  without a layout; otherwise the default layout wraps it. Such a page must
  also name its layout, as in `<NuxtLayout name="default">`: an unnamed one
  reads the page's own `layout: false` and renders no layout at all, so the
  header and navigation disappear. A site page that
  renders `<DrupalPageRoute>` should add `drupalPage: true` so its layout is
  resolved on the server.

- Drupal page heroes no longer fall back to the page's meta description. A
  meta description is written for search results and usually repeats the
  page's opening paragraph, so a page without Hero paragraph text now shows
  just its title. Projects that relied on the fallback should add the copy as
  Hero paragraph text.

- The angled mobile menu (`navigation.slideover.angle`) now has a soft shadow
  off its inner edge, where before it had none. The overlay draws it as a
  gradient, since the panel's clip-path would crop its own shadow. It fades in
  over `--stir-menu-shadow-duration` (480ms) once the panel lands and fades out
  over the same time as the panel starts to close. It matches a
  `shadow-lg/5`: 5% black at the edge, easing out over 1rem. Tune it with
  `--stir-menu-shadow-color`, `--stir-menu-shadow-size` and `--stir-menu-width`
  (28rem, the panel's `max-w-md`) on `.stir-menu-overlay`.

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

- **Behaviour change.** A CE proxy response marked private before Drupal
  answers stays `private, no-store, max-age=0`. The proxy copies Drupal's
  headers over the earlier marker, so a password-protected page's
  `/api/drupal-ce` payload came back publicly cacheable whenever Drupal sent
  `Cache-Control: public` for it. `markStirPrivateResponse` now also sets
  `event.context.stirPrivateResponse`, which the proxy honours. Test mocks
  that call it need an `event.context` object, as real H3 events have.

- A Layout paragraph's text alignment (`field_align`, for example "Text
  Center") now applies to its heading and content. Drupal sent it as
  `align.text`, but `Wrap/Grid.vue` only used `align.justify`, so it was
  dropped. Only Layouts with a text alignment set change; across the fleet,
  only one site has any.

- The calculator paragraph initialises its widget on a repeat client
  navigation. With the loader already loaded, it called `initPiperWidget()`
  during setup, before `<ClientOnly>` rendered the widget element, so the
  widget never appeared. It now waits for both the loader and the element.

- Floating webform labels show the required asterisk that `UFormField` shows
  on static labels, for text, email, tel, textarea, select, date and address
  fields. The marker comes from Nuxt UI's `formField` required variant, so an
  `ui.formField` override in app config applies to both label styles. Required text, email, tel, textarea and address inputs now carry
  `aria-required="true"` in both label modes. Address parts follow the
  validation schema: a part is required when the address or the part is.
  Selects get the visual marker only, because Reka's `required` would add
  native validation to its hidden select and pre-empt the form's own errors.

- Client navigation between Drupal pages keeps the current layout until the
  next page names its own. `NuxtLayout` reads the router's route, which changes
  when a navigation is confirmed, before `Drupal/PageRoute.vue` has loaded the
  page and set its layout. So every client navigation after the first, which
  Nuxt carries over from hydration, briefly built the `default` layout. On a
  site-layout page such as `clients`, that meant a throwaway header and
  editor bar whose setup cleared and reloaded the shared account menu, so the
  visible dropdown lost its chevron and the bar narrowed. On client
  navigation to a Drupal page, the current layout and its props (including an
  auth page's chrome) now carry over until the page names its own:
  `plugins/drupalPageLayout.server.ts` sets the layout from the fetched page
  and `plugins/drupalPageLayout.client.ts` carries it over. They stay separate
  so the Drupal CE client stays out of the initial browser bundle. No
  consumer action.

- `Drupal/Tabs.vue` caches the account menu per user
  (`menu-account--<user id>`) instead of clearing and reloading one shared
  menu whenever a bar mounts. An account switch gets its own menu, and a second
  bar or a data refresh reuses the menu in hand, so it never renders empty.
  `docs/debugging-navigation-flicker.md` records the two probes that found
  this.

- The patched Drupal CE `getPage()` no longer returns an empty page for the
  tick between Nuxt 4 purging the outgoing page's data and `page:finish`
  promoting the destination; it returns the fetched destination instead.
  Anything that watched the page, such as the editor bar's account-menu key,
  saw that empty tick. The change is also on upstream PR #538. **Consumer
  action:** copy the updated `patches/nuxtjs-drupal-ce@2.9.0.patch` into the
  application and run `pnpm install`.

- `MediaImage` no longer blinks when it re-renders an image the browser has
  already loaded, such as a menu photo each time the menu opens: loaded
  sources are remembered and start visible. Eager server-rendered images also
  start visible instead of waiting for JavaScript. New images still fade in.

- The "Skip to main content" link is visible when focused: it's fixed to the
  top of the viewport, with a solid token-based surface, highlighted text and
  a primary focus ring, so it reads over hero photos (WCAG 2.4.7 and 1.4.3).

- Auth form and status titles take `stirTheme.auth.titleClass` (default
  `mb-0 text-xl leading-7 font-semibold`). They no longer use `!important`
  classes, which blocked site styling; utilities already beat the base `h1`
  styles.

- `thirdPartyScripts.allowedOrigins` accepts subdomain wildcards such as
  `https://*.example.com`. The calculator allowed its widget's hosts by default
  (now listed by each site that embeds it; see Unreleased). **Behaviour change:** the calculator no longer
  derives `data-piper-origin` from the loader URL. The widget's loader works out its
  own API address, and an explicit `apiOrigin` still sets it. In dev, a refused
  third-party script URL logs a console warning instead of failing silently.

- A carousel without dot indicators (and a marquee) no longer takes
  `stirTheme.carousel.padding`, the bottom space kept for the dots. Sites that
  set `carousel.padding: ''` to hide that gap can drop the override.

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
  including project additions such as a site's own access flags, are
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
