# Plan: one source of truth for reveals

Status: steps 1 to 4 done (2026-11-23). Steps 5 (local site checks) and 6
(rollout) remain.

## Goal

Content fades or slides in the same way however the page arrived. That means
a hard refresh, a soft navigation, a signed-in browser render, and content
added later, such as View rows, carousels and gallery pages.

- **On screen when the page appears:** shown at once, with no blink.
- **Below the screen:** reveals when scrolled to, then stays in place.
- **Reduced motion:** everything shows at once.

There is one decision point for this, with tests for every load path. motion-v
stays the animation engine; nothing is hand-animated.

## Why

On 2026-11-23 four regressions came from the same shape of problem:

- **The reveal blink (since 9e6d8762, 7 Sep):** on-screen content went hidden
  and faded back in after load.
- **Rows stuck 50px low after a hard refresh:** the start state was passed as
  a re-applied `style`.
- **Views that never animated (since 8f266865, 30 Jul):** the paragraph's
  Animation was dropped.
- **The gallery fade lost on hard refresh (since 485c09d4, 16 Nov):** see
  below.

Each one was fixed where it showed up, and each fix uncovered another case,
because several pieces decide how a reveal behaves while the page loads:

1. **`useRevealMotionConfig`** tracks its own `hasMounted`. It switches
   `initial` from `false` to the hidden target after mount, and passes the
   hidden start state as `style` (`ssrVisible`).
2. **`RevealMotion`** (since fb75fd98) checks whether content is on screen at
   hydration and re-mounts what is below, but only when it can find its
   element. With `as-child` (Media overlay) it cannot.
3. **The image load fade** in `Media/Image.vue` (`!isLoaded && 'opacity-0'`)
   fades an image in when it finishes loading. Since 485c09d4 it skips
   server-rendered images for page speed. Galleries without an Animation
   relied on it for their scroll fade, so a hard refresh shows them without
   one.
4. **Per-component paths:**
   - Media/Item passes `ssrVisible: true`.
   - Hero passes `ssrVisible: isInherited` and `trigger: 'enter'`.
   - ViewDisplay row reveals pass `ssrVisible: true`.
   - Media used to hide itself with `motion-safe:opacity-0` until 04debdf3.

Current users of the reveal system:

- **Rich text:** `EditableRichText`.
- **Media:** `Media/Item`.
- **Paragraphs:**
  - `Layout`, `Carousel` and `Hero`, through `RevealMotionElement`;
  - Accordion, Button, Feature, Icon, InstagramFeed, Tabs and Timeline,
    through `ParagraphReveal`.
- **Pages:** `PageRevealScope`.
- **Views:** View rows, through `DrupalViewRowReveal` in `ViewDisplay`.

## Design

**One owner of load behaviour: `RevealMotion`.** Every reveal renders through
it, as now. It alone decides how a reveal starts:

| How the content appeared | What RevealMotion does |
|---|---|
| Server HTML, on screen at hydration | Render as is: `initial: false`, no reveal props |
| Server HTML, below the screen at hydration | Re-mount once, off screen; motion starts it hidden through `initial` and reveals it with `whileInView` |
| Drawn in the browser (soft navigation, signed-in render, rows added later) | motion's `initial` plus `whileInView`, unchanged |
| Reduced motion, or no IntersectionObserver | `initial: false` |

It finds its element for every render form, including `as-child` and
fragments (first element in its subtree). An element it cannot measure counts
as on screen, so it is never hidden.

**`useRevealMotionConfig` only describes the animation.** It returns the
effect's hidden target, the visible target, the transition and the in-view
options. It no longer reads hydration state: `hasMounted`, `ssrVisible`, the
start-state `style` and the `initial` switch all go. The options
`ssrVisible` and `trigger` are removed from callers; Hero's entrance
(`trigger: 'enter'`) becomes a RevealMotion prop, `play: 'enter' | 'inView'`.

**Galleries reveal on scroll by design, not by the image load fade.** A Media
paragraph with several items (`revealMode: 'gallery'`) gets a layer default
effect, `fade`, when neither the paragraph nor the page sets one:
`stirTheme.media.galleryReveal`, which a site can set to `false`.

**The image load fade becomes the placeholder transition only.** It stays as
the cross-fade from the placeholder to the image for images drawn in the
browser. It is no longer what makes a gallery fade on scroll. Server-rendered
images keep painting at once over the placeholder (485c09d4 and 12c4b27f
stay).

**Removed afterwards:**
- `ssrVisible` handling and `hasMounted` in `useRevealMotionConfig`;
- the `style` start state;
- the scripting-none rule's note about Media.

Each removal is checked against every site's code: `ssrVisible`,
`getRevealMotionProps` and `useRevealMotionProps` options in site components.

## Site code using the reveal directly

Two sites bind `getRevealMotionProps(..., { ssrVisible: true })` onto
motion-v's own `<Motion>`, bypassing RevealMotion. These have the same
weaknesses: the re-applied start style and no on-screen check at hydration.

- **One large site:** the classes marketing page, membership CTA and home
  page, about 20 blocks in three files.
- **The studio site:** FeatureGrid, Services and Work pages, three files.

They move to RevealMotion in the same release, with `<Motion v-bind=...>`
becoming `<RevealMotion v-bind=...>`, so the config change cannot break them.
Each is checked on a hard refresh, a soft navigation and signed in.

## Tests (written first, against today's code)

One browser fixture page per load path, each checked frame by frame:

1. **Hard refresh:**
   - on-screen rows never dip below opacity 1;
   - below-screen rows start hidden, reveal on scroll and end at opacity 1
     with transform none;
   - covers text rows, media rows and an `as-child` gallery.
2. **Soft navigation:** the same assertions.
3. **Browser-rendered first load (signed-in, `ssr: false`):** the same
   assertions.
4. **Rows added later:** a View filter or pager and a gallery page show their
   new content at once (876750f6) or reveal, per the rule, never stuck.
5. **Re-render after reveal:** forcing a parent re-render after the reveal
   leaves content in place.
6. **Reduced motion:** nothing waits hidden on any path.
7. **Hydration:** no Vue hydration warnings in a dev-mode run of the fixture.
   Production builds do not report attribute mismatches, so this needs its
   own dev-server check.
8. **Gallery default:** a gallery with no Animation reveals on scroll after a
   hard refresh, and `galleryReveal: false` turns that off.

Each test must fail on today's code where today's behaviour is wrong (gallery
after a hard refresh, `as-child`) and pass where it is right.

## Step 1 results (2026-11-23)

`tests/nuxt/e2e/reveal.e2e.spec.ts`, against layer fb75fd98 on its own
fixture pages:

| Load path | Test | Today |
|---|---|---|
| Hard refresh | On-screen reveals never dip | passes |
| Hard refresh | Below-screen rows start hidden, then all end in place | passes |
| Hard refresh | Content stays in place when the page re-renders afterwards | passes |
| Hard refresh | An animated gallery (as-child) starts hidden below the screen | passes |
| Hard refresh | A gallery with no Animation reveals on scroll | **fails (known gap, `it.fails`)** |
| Soft navigation | Below-screen rows start hidden, then end in place | passes |
| Signed-in first load (`ssr: false`) | The same | passes |
| Reduced motion (each path) | Nothing waits hidden | passes |

So the `as-child` lookup already works; the gallery gap is only that a gallery
without an Animation has no reveal. Still to add in step 2: rows added later
(View filter and pager), and a dev-mode hydration-warning run.

## Steps 2 to 4 results (2026-11-23)

- `RevealMotion` owns load behaviour, including reduced motion and missing
  IntersectionObserver, and takes `play: 'inView' | 'enter' | 'load'`. Hero
  passes `enter` for the page's inherited Animation and `load` for its own.
- `getRevealMotionProps` returns the animation only; `ssrVisible` and
  `trigger` are deprecated no-ops.
- Galleries default to `stirTheme.media.galleryReveal: 'fade'`.
- All 10 browser reveal tests pass, the gallery test included. The gallery
  fixture now has a single lead image first, since the page's first media row
  loads eagerly without a reveal by design.
- Rows added later are covered by the View row runtime tests (876750f6). The
  dev-mode hydration-warning run is left for the local site checks.
- Both sites' direct `<Motion>` uses moved to `RevealMotion`. That works on
  the current layer too, so the sites can land first.

## Steps

1. **Tests first:** add the fixture pages and the tests above. Record which
   pass today.
2. **RevealMotion owns load behaviour:** element lookup for `as-child` and
   fragments, and the `play` prop. Callers keep working.
3. **`useRevealMotionConfig` describes only:** remove `hasMounted`,
   `ssrVisible` and the style start state. Update Media/Item, Hero, ViewDisplay
   and the paragraph wrappers. Search every site's code before removing an
   option.
4. **Gallery default effect** plus `stirTheme.media.galleryReveal`, documented
   in docs/stir-theme-config.md.
5. **Verify:**
   - all suites, plus a dev-mode hydration run;
   - locally on the media-heaviest site's gallery, one View site and one
     carousel site, for hard refresh, soft navigation and signed in;
   - Lighthouse on one gallery page, compared with today (LCP, CLS, TBT).
6. **Rollout:** one site first, checked live, then the rest.

## Risks

- **Re-mounting below-screen content once costs a render.** It happens off
  screen. Measure it on the largest gallery: it must not add long tasks
  during scroll.
- **CLS:** reveals animate opacity and transform only, never layout, and the
  tests assert transform none at the end.
- **Site code passing `ssrVisible` or `trigger`:** search every site before
  removing them, and keep a no-op alias for one release if any site uses them.
