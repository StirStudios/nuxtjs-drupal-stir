# Editorial layer

This layer owns editor-only presentation for Drupal local tasks, account-menu
navigation, entity and paragraph edit actions, and inline paragraph text
editing. Drupal remains authoritative for authentication, access checks, and
the links or tasks exposed to Nuxt.

The full compatibility preset includes this capability so established projects
retain their editorial tools. The minimal preset omits it; shell-free theme
fallbacks preserve public rendering for shared components without loading edit
controls, local-task tabs, inline-edit behavior, or admin CSS.
