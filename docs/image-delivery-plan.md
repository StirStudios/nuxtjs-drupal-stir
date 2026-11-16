# Image delivery restructure plan

Status: proposed, November 2026. Replaces the profile-inference model in
`layers/theme/app/utils/imageDelivery.ts` with the approach most image
frameworks take (Next.js Image, Unpic, Astro): a fixed width ladder for
`srcset`, `sizes` generated from declared layout, and one loading policy.

## Why

Image sizing has needed a fix in almost every recent media release. The
causes are structural, not individual bugs:

- **Widths are guessed.** A named profile (`container`, `split`, `card`,
  `splitWide`...) is inferred from layout keys and grid class strings, and
  their caps assume one container width (1472px). Nothing ties them to the
  CSS that actually lays the page out.
- **Nesting does not compose.** `layoutImageDeliveryProfileKey`,
  `carouselImageDeliverySizesKey`, `fullBleedParagraphsKey` and
  `sectionHeroMediaKey` each replace the decision instead of narrowing it. A
  3-column gallery inside a split column asks for the `card` width, about
  twice its slot.
- **Candidates come from `sizes`.** @nuxt/image builds each srcset width as
  the `sizes` entry multiplied by its breakpoint, so candidates are few and
  far apart (container: 640, 768, 1280, 1472, 1536, 2944). A 1024px tablet at
  2x gets the 2944px file.
- **Cover heights are estimates,** defined twice (`media.heights` classes and
  `coverHeights` numbers) plus a copy in `Paragraph/Hero.vue`; the hero
  height is a guess.
- **Tests check strings, not outcomes.** Unit tests assert profile names and
  `sizes` strings. The audit samples 390, 1400 and 1920px only, so the
  768-1279px range is never checked.

## Target design

1. **One width ladder.** `srcset` always comes from a fixed list, capped at
   the source width: 320, 480, 640, 750, 828, 1080, 1200, 1440, 1920, 2400,
   2880. Built with `$img` per width by our own builder; @nuxt/image's
   `sizes`-driven candidates are no longer used for these components. The CDN
   caches a bounded set of URLs, and the browser always has a candidate within
   about 25% of its need.
2. **A slot width model instead of profile names.** One injection key,
   `imageSlotKey`, holds the width available to an image per breakpoint:
   `{ [breakpoint]: { fraction, gapPx, capPx } }`. The page root provides it
   from the container settings. Every component that splits space narrows it
   from structured data and provides the result:
   - Layout and grid paragraphs, from `GridConfig` columns and gap.
   - Views, from their grid config.
   - Carousels, from slides per view and gap.
   - Full-bleed sections and heroes provide `{ fraction: 1, capPx: none }`.

   Nesting composes by construction. No class-string parsing.
3. **One container setting shared with CSS.** Container max width and padding
   per breakpoint live in one place in the theme config. The CSS custom
   properties and the root slot model are both generated from it, so a site
   that changes its container changes its image sizes with it.
4. **`sizes` generated from the slot model.** Media queries on the theme's own
   breakpoints, with `calc(min(...))` values where a cap applies. For lazy
   images, prefix `auto,` so browsers that support `sizes="auto"` use the
   real laid-out width.
5. **Cover boxes declare their height as data.** One `mediaHeights` table
   (`{ min, vw, max }` per height) generates both the CSS class and the cover
   maths. Heroes get an explicit height token instead of an estimate. In a
   fixed-height box the image is requested cropped to the box's aspect ratio
   per breakpoint (IPX `fit=cover` with a focal point where Drupal supplies
   one), through `<picture>` sources, so a phone no longer downloads a whole
   wide photo to show a slice of it.
6. **One loading policy.** Exactly one lead image per page: the route or
   section hero if present, else the first media. It is eager,
   `fetchpriority="high"`, and preloaded with `imagesrcset`/`imagesizes`.
   Everything else is lazy. Server-rendered images are never hidden behind
   `opacity-0` until hydration; the skeleton sits behind the image instead.
7. **Rich text uses the same builder,** with its slot from the paragraph's
   structured width.

## Public contract changes

These are consumer-affecting and go in `CHANGELOG.md`.

| Today | After |
| --- | --- |
| `stirTheme.media.image.profiles` (named `sizes` strings) | Removed. Replaced by container settings and the slot model. Kept, ignored, for one release with a dev warning. |
| `stirTheme.media.image.coverHeights` | Merged into one `mediaHeights` table that also generates the height classes. |
| `deliveryProfile` prop (Drupal payload) | Accepted for one release, mapped to a slot (`full`, `container`); then removed. |
| `deliverySizes` prop | Kept as an explicit override of `sizes` only; `srcset` still comes from the ladder. |
| `layoutImageDeliveryProfileKey`, `carouselImageDeliverySizesKey`, `fullBleedParagraphsKey`, `sectionHeroMediaKey` | Replaced by `imageSlotKey`. Run `pnpm audit:consumers` before removing; sites may inject them. |
| `maxWidth` image modifier (new in 90750764) | Superseded by the ladder cap; removed with it. |

No Drupal schema change is required. Drupal may later send a focal point for
cover crops; that is optional.

## Phases

Each phase ships on its own and leaves every site working.

1. **Measure.** Add a browser-selection simulator to the unit tests: parse
   the emitted `sizes` and `srcset`, pick a candidate the way a browser does,
   and compare it with the shown width across 320-2560px at DPR 1, 2 and 3.
   Add 768, 1024 and 1280px (DPR 2) to the `audit:perf` image viewports. Run
   both against today's code to get a baseline per layout.
2. **Ladder.** Build `srcset` from the fixed ladder, capped at the source,
   for `Media/Image` and rich text. `sizes` unchanged. Expect fewer bytes on
   tablets and 2x laptops, and fewer cached URLs.
3. **Slot model.** Add the container settings and `imageSlotKey`; make
   Layout, grids, Views, carousels and heroes narrow and provide it; generate
   `sizes` from it. Profile names and the four old keys become adapters onto
   the slot model, then are deprecated.
4. **Heights and cover crops.** One `mediaHeights` table; explicit hero
   height; per-breakpoint cropped sources for fixed-height cover boxes.
5. **Loading policy.** One lead image with preload; remove `opacity-0` on
   server-rendered images.
6. **Remove the old path** after one release: profiles, `coverHeights`,
   `resolve*Profile` functions, the old keys and `maxWidth`.

## Verification per phase

- Simulator: no under-delivery, and over-delivery within one ladder step,
  across the full viewport and DPR sweep, for every layout fixture.
- `pnpm audit:perf` on two client sites, including a page with a gallery, a
  carousel and a split layout: 0 image errors.
- `pnpm perf:lighthouse`, 3 mobile runs, medians before and after on the
  same build setup: score, FCP, LCP, TBT, total transfer, media transfer,
  video requests.
- `pnpm audit:consumers` before any removal; `pnpm verify:ci` on the PR.

## Out of scope

- JavaScript weight. On one measured client home page, simulated mobile LCP
  is bound by total bytes, mostly 0.42 MB of JS. That needs its own review.
- Video delivery.

## References

- [HTML responsive images, `sizes` and `srcset`](https://html.spec.whatwg.org/multipage/images.html#sizes-attributes)
- [`sizes="auto"` for lazy images](https://developer.chrome.com/blog/sizes-auto)
- [Optimize LCP, resource priority and preload](https://web.dev/articles/optimize-lcp)
- [Next.js Image `deviceSizes`/`imageSizes`](https://nextjs.org/docs/app/api-reference/components/image)
- [Unpic layouts](https://unpic.pics/img/)
- [@nuxt/image `sizes`](https://image.nuxt.com/usage/nuxt-img#sizes)
