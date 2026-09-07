# Image loading and priority

The layer separates when an image is eligible to load from how urgently it should be fetched.

- Ordinary MediaImage rendering honors Drupal's loading and fetchpriority values. Eager loading no longer implicitly promotes an image to high priority.
- ParagraphCarousel provides a native viewport-loading policy to descendant MediaImage components, including nested project teaser renderers and marquee content. These images render with loading="lazy" and fetchpriority="auto", even when their original Drupal hero paragraph supplied eager/high hints.
- The policy changes delivery attributes only. It preserves sources, responsive sizes, image dimensions, hero styling, editing controls and existing markup.
- A page hero outside that region retains its explicit eager/high attributes.

The browser starts visible lazy images after layout without waiting for Vue hydration. It can fetch nearby off-screen slides ahead of interaction, and automatically prioritizes visible images. Native look-ahead thresholds vary by browser and connection; this is not a promise of zero requests until an image crosses the exact viewport edge.

The server cannot reliably infer the user's viewport or whether a reusable carousel is above the fold. Therefore the carousel does not mark every source hero high priority or guess that the first carousel on a page is the LCP. For a known image-led page hero, keep explicit critical-image delivery outside the generic carousel policy. Measure representative image-led carousel pages before claiming this is an optimal LCP policy for every layout.

This is independent of lazy hydration. Keeping an img source in SSR lets the browser discover it before JavaScript; a hydration observer alone cannot prevent an eager request. The layer does not reinstate the earlier universal hydration POC or add source swapping, event replay, viewport scripts or DOM wrappers.

## Validation

Cover above- and below-fold carousels, fade and sliding modes, nested project renderers, original hero media reused as teasers, first keyboard/pointer activation and explicit non-carousel hero priority. Compare matched production builds before making performance claims. Browser-native loading does not depend on VueUse observers; existing VueUse carousel visibility tracking continues to control autoplay.

References: [native image lazy loading](https://web.dev/articles/browser-level-image-lazy-loading), [Nuxt Image attributes](https://image.nuxt.com/usage/nuxt-img), [LCP resource priority](https://web.dev/articles/optimize-lcp).
