# Editorial layer

This layer owns editor-only presentation for Drupal local tasks, account-menu
navigation, entity and paragraph edit actions, and inline paragraph text
editing. Drupal remains authoritative for authentication, access checks, and
the links or tasks exposed to Nuxt.

The platform layer includes this capability by default so established projects
retain their editorial tools. Keeping it isolated prevents editor UI concerns
from spreading further through the public theme and provides a future boundary
for deployments that intentionally omit frontend editorial tooling.
