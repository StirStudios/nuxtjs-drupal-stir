# Consumer compatibility inventory

Read-only scan on 2026-09-06. Existing Stir consumers that extend `@stir/base`; app/server TypeScript, JavaScript and Vue. No client files changed. Counts are references, not a guarantee that a module is used at runtime.

| Consumer | Legacy alias references | Candidate deprecated API references |
|---|---:|---:|
| DDrink/ddrink-nuxt | 0 | 0 |
| Trilink/trilink-nuxt | 0 | 0 |
| LaAmada/laamada-nuxt | 1 | 0 |
| SBPublic/sbpublicmarket-nuxt | 2 | 0 |
| EdSmart/ed-nuxt | 3 | 0 |
| Stir GIT/stir-nuxt | 0 | 0 |
| RSF/rsf-nuxt | 2 | 0 |
| DP/danceplug-decoupled/danceplug-nuxt | 1 | 3 |
| TKFlagg/tkflagg-nuxt | 2 | 0 |
| Stir GIT/stirs-decoupled/stirs-nuxt | 0 | 0 |

Compatibility aliases and deprecated listing adapters remain supported in this major. Move real callers to `#stir/*` and `useStirListing` during client work; only remove adapters after the documented deprecation/version boundary. The protected-login limiter helpers are internal server implementation details, and no scanned client called the superseded check/record pair.

## References requiring eventual migration

### LaAmada/laamada-nuxt

- `app/components/App/Footer.vue`: 1 legacy aliases; 0 candidate API references.
### SBPublic/sbpublicmarket-nuxt

- `app/components/App/Popup.vue`: 2 legacy aliases; 0 candidate API references.
### EdSmart/ed-nuxt

- `app/components/global/node--project.vue`: 1 legacy aliases; 0 candidate API references.
- `app/components/global/node--alert.vue`: 1 legacy aliases; 0 candidate API references.
- `app/components/global/drupal-view--press.vue`: 1 legacy aliases; 0 candidate API references.
### RSF/rsf-nuxt

- `app/components/global/node--project.vue`: 1 legacy aliases; 0 candidate API references.
- `app/components/global/node--project--teaser.vue`: 1 legacy aliases; 0 candidate API references.
### DP/danceplug-decoupled/danceplug-nuxt

- `app/composables/useClassListing.ts`: 0 legacy aliases; 1 candidate API references.
- `app/composables/useListingViewController.ts`: 0 legacy aliases; 1 candidate API references.
- `app/composables/useEditorialListing.ts`: 0 legacy aliases; 1 candidate API references.
- `app/components/App/Popup.vue`: 1 legacy aliases; 0 candidate API references.
### TKFlagg/tkflagg-nuxt

- `app/components/global/node--article.vue`: 1 legacy aliases; 0 candidate API references.
- `app/components/global/node--recommendations.vue`: 1 legacy aliases; 0 candidate API references.
