# Runtime environment

Which settings change when a deployed app restarts, and which need a rebuild.

## How the environment reaches the app

On Stir servers, pm2 starts each app from `shared/ecosystem.config.js`. Since
2026-09-25 the generated file reads `shared/.env` and passes every key to the
Nitro process (stir-server-config, `create_project.sh`). Before that, pm2 7
ignored the old `env_file` key, so no `.env` key reached a running app and an
`.env` edit only took effect at the next build. Sites provisioned earlier keep
the old file until they are updated by hand.

To apply an `.env` edit, run as the site user from `htdocs/current`:

```bash
pm2 startOrReload ecosystem.config.js --update-env && pm2 save
```

`pm2 restart <name>` reuses the saved environment and does not reread `.env`.
Varnish keeps serving cached pages, so purge the site when the change affects
rendered HTML or public runtime config.

## What a restart can change

Nuxt fixes `nuxt.config.ts` at build. At runtime a value changes only through:

1. A `NUXT_`-prefixed variable whose name matches an existing `runtimeConfig`
   path, for example `runtimeConfig.drupalRequestTimeoutMs` ←
   `NUXT_DRUPAL_REQUEST_TIMEOUT_MS`. Nested keys join with `_`, and values are
   parsed as JSON, so arrays are written as `'["a","b"]'`. The key must exist
   in the build with a serializable default: a key whose build value was
   `undefined` is dropped and cannot be overridden.
2. `NUXT_SITE_*` (or `NUXT_PUBLIC_SITE_*`), which nuxt-site-config reads at
   runtime for `site.url`, `site.name` and `site.indexable`.
3. Server code that reads `process.env` directly.

The layer's documented names (`DRUPAL_API_KEY`, `TURNSTILE_SECRET`,
`PROTECTED_PASSWORD`, …) are none of these. They set build-time defaults only.

### Settings apps expect to change on restart

| Documented name | runtimeConfig path | Name that overrides it at runtime today |
| --- | --- | --- |
| `DRUPAL_API_KEY` | `apiKey` | `NUXT_API_KEY` |
| `PROTECTED_PASSWORD` | `protectedPassword` | `NUXT_PROTECTED_PASSWORD` |
| `TURNSTILE_SECRET` | `turnstile.secretKey` | `NUXT_TURNSTILE_SECRET_KEY`, only if set at build |
| `TURNSTILE_KEY` | `public.turnstile.siteKey` | `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, only if set at build |
| `NUXT_URL` | `siteUrl`, `site.url` | `NUXT_SITE_URL` (covers both) |
| `DRUPAL_REQUEST_TIMEOUT_MS` | `drupalRequestTimeoutMs` | `NUXT_DRUPAL_REQUEST_TIMEOUT_MS` |
| `DRUPAL_SESSION_COOKIE_NAMES` | `drupalSessionCookieNames` | `NUXT_DRUPAL_SESSION_COOKIE_NAMES` (JSON array) |
| `DRUPAL_FORWARD_CLIENT_IP` | `drupalClientIpForwarding.enabled` | `NUXT_DRUPAL_CLIENT_IP_FORWARDING_ENABLED` |
| `DRUPAL_TRUST_PROXY` | `drupalClientIpForwarding.trustProxy` | `NUXT_DRUPAL_CLIENT_IP_FORWARDING_TRUST_PROXY` |
| `PROTECTED_RATE_LIMIT_*` | `protectedRateLimit.*` | `NUXT_PROTECTED_RATE_LIMIT_ENABLED`, `…_MAX_ATTEMPTS`, `…_WINDOW_SECONDS`, `…_TRUST_PROXY` |
| `WEBFORM_MAX_*` | `webformSubmissionLimits.*` | `NUXT_WEBFORM_SUBMISSION_LIMITS_MAX_REQUEST_BYTES`, `…_MAX_FILE_BYTES`, `…_MAX_FILES`, `…_MAX_FIELDS` |
| `NUXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NUXT_PUBLIC_PLAUSIBLE_API_HOST` | `public.plausible.*` | Same names; already runtime |
| `NUXT_STIR_AUTH_REGISTER_ALLOWED_FIELDS` | `stirAuthRegister.allowedFields` | Same name; already runtime |
| `NUXT_PUBLIC_DRUPAL_CE_*` | `public.drupalCe.*` | Same names; already runtime |

### Settings that need a rebuild

- `NUXT_ENV` and `NUXT_INDEXABLE`: indexability, application mode and whether
  the Plausible client plugin is bundled.
- `DRUPAL_URL` and `DRUPAL_CDN`: also shape image providers, route rules and
  SEO proxying at build. Overriding only `NUXT_API` or the Drupal CE base URLs
  at runtime would leave those pointing at the old host, so change Drupal
  hosts with a deploy.
- `NUXT_IMAGE_CDN`, `NUXT_NAME` (runtime `NUXT_SITE_NAME` exists but is not
  used by Stir), `SERVER_DOMAIN_CLIENT` and `NODE_ENV`.

The keys generated `.env` files contain today (`NUXT_ENV`, `NUXT_NAME`,
`NUXT_INDEXABLE`, `NUXT_URL`, `NUXT_IMAGE_CDN`) match no `runtimeConfig` path,
so passing them to the process changes nothing in the layer. Downstream server
code that reads `process.env` directly does see them now.

## Proposal

Not implemented. It changes the layer's public environment contract, so it
needs its own release and consumer notes.

1. Give every setting in the first table a serializable build default (`''`,
   `false`, a number) so its runtime name always works. Turnstile is the gap
   today: an unset key at build is dropped.
2. Adopt the namespaced names from the
   [architecture review](architecture.md#p1--documented-environment-variables-are-mainly-build-time-inputs):
   move the settings under `runtimeConfig.stir` (for example
   `NUXT_STIR_DRUPAL_API_KEY`, `NUXT_STIR_PROTECTED_PASSWORD`,
   `NUXT_STIR_TURNSTILE_SECRET`), keep the current names as build-time
   defaults with a deprecation warning, and switch the stir-server-config
   `.env` scaffold and Capistrano doctor checks to the new names.
3. Use `NUXT_SITE_URL` for the canonical host at runtime instead of adding a
   second name.
4. Leave build-shaped settings (the second list) as build inputs, and say so
   in the readme.

Until then a server `.env` can make a setting restart-changeable without a
layer change by adding the runtime name next to the documented one, for
example `NUXT_API_KEY="${DRUPAL_API_KEY}"`. The ecosystem file expands
`${VAR}`, so editing `DRUPAL_API_KEY` and reloading updates both.
