# Image delivery evaluation

Status: opt-in implementation checkpoint; no default delivery change is
approved or enabled.

## Goal

Determine whether Nuxt Image should replace Drupal responsive image derivatives
for width- and format-based delivery while Drupal remains authoritative for the
managed file, intrinsic dimensions, alt text, credit, access, and editorial
metadata.

This evaluation does not propose moving media ownership into Nuxt. It also does
not remove the existing Drupal `src`, `srcset`, modal sources, or responsive
styles while downstream compatibility is required.

## Contract foundation

Stir Tools contract `1.20.0` publishes two additive fields:

- `original_src`: the canonical Drupal-managed file URL;
- `original_revision`: an opaque identity composed from the managed file ID,
  changed timestamp, and file size.

An optimizer must use `original_src`, never infer an original from a styled URL.
It should include `original_revision` in its source/cache identity. A same-name
replacement performed through Drupal then produces a new optimized URL without
purging every derived width. Direct filesystem overwrites that bypass Drupal
must update/save the managed file entity or explicitly invalidate delivery
caches.

The Nuxt layer accepts both fields without emitting them as HTML attributes.
Native Drupal responsive rendering remains the current default.

## DancePlug baseline

The local DancePlug Drupal 11 project currently performs width-based responsive
resizing and WebP conversion. It does not use editorial image cropping or focal
point transformations, so there is no crop behavior to reproduce in this
comparison.

One full-width homepage image currently publishes nine Drupal candidates from
640px through 2880px. The source JPEG is 5000 by 3000 pixels and 293,400 bytes.
Drupal serves generated derivatives directly after generation, but the first
missing derivative request enters Drupal. Cache headers observed on that first
request differed from already-materialized files and need production/CDN
verification before migration.

## Isolated Nuxt Image 2.0 experiment

An uncommitted temporary Nuxt 4.4.8 application used the default IPX provider
against the same local Drupal originals. The experiment did not add Nuxt Image,
Sharp, or IPX to the base layer.

Measured payload bytes:

| Image            | Width | Drupal WebP | IPX WebP q75 | Difference |
| ---------------- | ----: | ----------: | -----------: | ---------: |
| homepage-renee   |   640 |      16,272 |       13,242 |     -18.6% |
| homepage-renee   |  1200 |      36,568 |       30,028 |     -17.9% |
| homepage-tovaris |   640 |      14,144 |       11,564 |     -18.2% |
| homepage-tovaris |  1200 |      32,876 |       26,482 |     -19.4% |

The IPX responses included long-lived public and shared-cache headers. A visual
inspection of Drupal WebP, IPX q75, and IPX q80 at 1200px found no obvious
quality regression in the tested hero. This is not a perceptual-quality lab
score and must be broadened to detailed faces, text, illustrations,
transparency, and user-uploaded images.

AVIF at the tested setting was larger than WebP for this image. Format choice
must therefore remain evidence-led rather than assuming AVIF is always smaller.

## Candidate generation

Generic Nuxt Image defaults are not sufficiently deliberate for this layer:

- a full-width test produced ten candidates, compared with Drupal's nine;
- a card profile produced eight candidates because default density variants
  were added;
- the fallback `src` selected a large high-density candidate.

Only the browser-selected candidate is transformed and downloaded, so candidate
count is not equivalent to network transfer. It does increase markup and the
potential optimizer/cache key space. The integration should use a small set of
layer-owned semantic profiles such as `hero`, `container`, `card`, `avatar`, and
`modal`. Profiles must be based on measured rendered widths and device density,
not copied from every Tailwind breakpoint.

If standard `<NuxtImg>` sizing produces an unnecessarily broad set, use Nuxt
Image's supported custom rendering or `useImage().getSizes()` API so URL
generation remains provider-owned while `MediaImage` controls the exact native
markup and candidate policy.

## Cache and CDN model

The preferred model is immutable/versioned delivery:

1. Drupal publishes `original_src` and `original_revision`.
2. Nuxt Image or an image CDN includes the revision in its optimizer cache key.
3. Replacing a managed file generates newly addressed derivatives.
4. Old derivatives expire naturally.
5. `stir_cdn` invalidates pages, API responses, and Drupal caches; it does not
   enumerate every image width and format for routine replacement.

Explicit optimizer purge remains a recovery/administrative operation, not the
normal content freshness mechanism.

Production design still needs to confirm:

- where IPX output is cached (Varnish, CDN, or both);
- whether query strings and optimizer paths are part of the cache key;
- origin allowlisting and SSRF protections;
- behavior for private/access-controlled media;
- first-hit transformation CPU, latency, concurrency, and failure behavior;
- cache retention limits and cleanup for superseded revisions;
- whether a managed image CDN is operationally preferable to self-hosted IPX.

The opt-in macOS build increased the Nitro server artifact from approximately
10.1 MB to 30.6 MB because IPX included Sharp's native binary; it did not imply
the same increase in browser JavaScript. Native binaries must be built for the
deployment architecture. An external provider may avoid this self-hosted image
processing cost and must be included in the production comparison.

## Recommended staged decision

1. Keep Drupal responsive image rendering as the default during the rebuild.
2. Use the opt-in Nuxt Image delivery path behind `MediaImage`, which consumes
   the versioned original source and semantic profiles and falls back to Drupal
   for incomplete or unknown payloads.
3. Enable it first in DancePlug development for representative heroes, grids,
   cards, avatars, modal images, video posters, and user uploads.
4. Compare Lighthouse/LCP, transferred bytes, cache hit ratios, first-hit
   latency, visual quality, Node resource use, accessibility markup, and error
   fallback against the existing path.
5. Pause for an explicit product/operations decision before making Nuxt Image
   the layer default or removing Drupal responsive image configuration.

The current evidence supports building the opt-in path. It does not yet prove
that self-hosted IPX should be the production default for every downstream
project.
