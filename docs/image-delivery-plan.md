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
   2880, 3360, 3840. Built with `$img` per width by our own builder; @nuxt/image's
   `sizes`-driven candidates are no longer used for these components. The CDN
   caches a bounded set of URLs, and no two candidates are more than a third
   apart.
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

These are consumer-affecting and go in `CHANGELOG.md`. Stir controls every
site's rollout, so there are no compatibility shims: each removal lands with
the matching site changes in the same rollout. A site that has not updated
keeps its locked layer version and is unaffected until it does.

| Today | After |
| --- | --- |
| `stirTheme.media.image.profiles` (named `sizes` strings) | Removed. Replaced by container settings and the slot model. No site overrides it; the Stir site reads `profiles.container` and `profiles.split` in its work teasers and moves to the slot model in the same rollout. |
| `stirTheme.media.image.coverHeights` | Merged into one `mediaHeights` table that also generates the height classes. No site overrides it. |
| `deliveryProfile` (Drupal payload) | Stir Tools sends it from every site's exported CE display config (`full`, `container`, `card`, `auto`). With the slot model only "edge to edge" carries information, so Stir Tools replaces the setting in phase 3 (see below). Done: Stir Tools 1.41.0 no longer sends it, and the layer no longer reads it (heroes span the viewport on their own). |
| `deliverySizes` prop | Kept as an explicit override of `sizes` only; `srcset` still comes from the ladder. One site passes fixed px values to it in its own components. |
| `layoutImageDeliveryProfileKey`, `carouselImageDeliverySizesKey`, `fullBleedParagraphsKey`, `sectionHeroMediaKey` | Replaced by `imageSlotKey`. No site uses them. |
| `maxWidth` image modifier (new in 90750764) | Superseded by the ladder cap; removed with it. |

The Stir site's `Work/PreviewTeaser.vue` passes `profiles.container` and
`profiles.split` as `delivery-sizes`; when it takes this layer, drop both
props so the View or carousel slot sizes the teasers.

One site's own Media paragraph applies scroll effects through `.media>img`
selectors; cover-cropped images are now `.media > picture > img`, so widen
those selectors to `.media img` when it takes phase 4.

Phase 4 kept the `media.heights` classes (Tailwind needs them written out) and
made `coverHeights` the numbers both the hero and the image sizing read, with a
test that fails if the classes and numbers disagree. Heroes keep an estimated
height and are not cropped: their object position varies by theme.

Site usage was checked in every local site checkout (November 2026); rerun
`pnpm audit:consumers` before each removal.

### Stir Tools

Phase 3 includes a Stir Tools change, shipped with the layer change:

- Replace the media formatter's `delivery_profile` setting
  (`StirMediaFormatterSettings`, `StirMediaCeFieldFormatter`, the
  `ImageMediaBuilder` and `ImageAssetMetadataBuilder` output, and the
  Instagram processor's resolved profile) with nothing, or with a boolean
  edge-to-edge flag if a case remains that layout cannot express.
- Update the bundled CE display config (hero, popup, media, carousel and
  carousel item) and add a post-update that removes the setting from each
  site's active config, following Stir Tools'
  `docs/upstreaming-and-update-paths.md`. Each site runs `drush updb` and
  `drush cex` in the same commit.
- Optional, phase 4: send the image's focal point, if the site uses one, so
  cover crops keep the subject in frame.

## Phases

Each phase ships on its own; each site is updated as it takes the layer.

1. **Measure.** Done (November 2026). Add a browser-selection simulator to the unit tests: parse
   the emitted `sizes` and `srcset`, pick a candidate the way a browser does,
   and compare it with the shown width across 320-2560px at DPR 1, 2 and 3.
   Add 768, 1024 and 1280px (DPR 2) to the `audit:perf` image viewports. Run
   both against today's code to get a baseline per layout.
2. **Ladder.** Done (November 2026). Build `srcset` from the fixed ladder,
   capped at the source, for `Media/Image` and rich text. `sizes` unchanged. Expect fewer bytes on
   tablets and 2x laptops, and fewer cached URLs.
3. **Slot model.** Done (November 2026, layer side). Add the container settings and `imageSlotKey`; make
   Layout, grids, Views, carousels and heroes narrow and provide it; generate
   `sizes` from it. Remove the profiles and the four old keys, update the
   Stir site's work teasers, and ship the Stir Tools change above, in the
   same rollout.
4. **Heights and cover crops.** Done (November 2026). One `mediaHeights` table; explicit hero
   height; per-breakpoint cropped sources for fixed-height cover boxes.
5. **Loading policy.** One lead image with preload; remove `opacity-0` on
   server-rendered images.
6. **Clean up** whatever the earlier phases left: `coverHeights`, the
   remaining `resolve*Profile` functions and `maxWidth`.

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
