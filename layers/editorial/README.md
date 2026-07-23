# Editorial layer

This layer owns editor-only presentation for Drupal local tasks, account-menu
navigation, entity and paragraph edit actions, and inline formatted-text
editing. It also owns the authenticated formatted-text read/write proxy routes;
consumers that omit this layer do not ship those mutation endpoints. Drupal
remains authoritative for authentication, access checks, and the links or
tasks exposed to Nuxt.

`EditableRichText` accepts an `editTarget` containing `entityType`, `entityId`,
and `fieldName`. The matching Drupal formatter emits this metadata beside
single-value formatted-text fields, so node bodies and paragraph text use the
same editor without bundle-specific endpoints or downstream coercion. The
legacy paragraph `id` prop remains a compatibility fallback.

The editor keeps Drupal's stored text format unchanged, preserves supported
Drupal-specific blocks such as `<drupal-media>` and `<stir-cta>`, and exposes a
Nuxt UI drag handle for safe top-level block reordering. Drupal remains the
source of truth for field access, required validation, revision creation, and
the saved HTML value.

The full compatibility preset includes this capability so established projects
retain their editorial tools. The minimal preset omits it; shell-free theme
fallbacks preserve public rendering for shared components without loading edit
controls, local-task tabs, inline-edit behavior, or admin CSS.
