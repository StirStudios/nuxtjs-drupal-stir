# September 2026 audit integration changes

The Drupal toolkit owns authorization, field validation, revision persistence and sitemap generation. The shared Nuxt layer preserves those decisions:

- Both inline text mutation routes require a string and preserve it exactly, including whitespace and an empty string. Drupal decides whether the field is required and returns its normal validation status. This also fixes plain-text whitespace loss in the generic route.
- HTTP 409 from Drupal remains HTTP 409 with a safe explanation to reload or use the Drupal editor. Raw upstream details are not exposed. This covers stale/disconnected ownership and content that must use Drupal moderation.
- Same-origin checks, CSRF retrieval, cookies, request timeouts, redirect handling and private response behavior remain in place.
- Sitemap success payloads retain the existing schema. The Drupal fix reads published chunks locally and returns an error if a chunk is unavailable; Nuxt should not treat that error as a successful empty sitemap.

Deploy the paired Drupal changes through the normal project workflow. No per-client component rewrite or new environment variable is required for these Nuxt changes. Drupal's PDF endpoint now needs explicit complete origins in its existing origin settings; verify each consuming project's origin configuration separately.

Validation uses the server policy/contract tests and the full layer/packed-consumer checks. Production editorial, moderation, forms and cache smoke checks remain required when upgrading a specific site. Concurrent editor-component work is outside this change's ownership.
