# Runtime environment

Which settings change when a deployed app restarts, and which need a rebuild.

## How the environment reaches the app

On Stir servers each site's Nuxt app runs as a systemd unit,
`stir-nuxt@<instance>` (instance `<user>`, or `<user>-a` / `<user>-b` for a
two-instance site), set up by stir-server-config `setup_nuxt_unit.sh`. The
unit starts Nitro through `nuxt/start.mjs`, which reads the site's
`htdocs/shared/.env` (the unit's `STIR_ENV_FILE`) with `nuxt/app-env.cjs`
before the app loads. That parser handles `export`, single and double quotes,
trailing comments and `${VAR}` expansion from earlier keys, so chained values
such as `DRUPAL_URL="https://${SITE_DOMAIN}"` work. systemd's
`EnvironmentFile=` is not used because it does not expand `${VAR}`.

The same `shared/.env` is linked into each release, so `nuxi build` reads it
too: `nuxt.config.ts` sees it at build, the running process sees it at start.

Precedence in the running process:

1. Values the unit sets (`Environment=`): `NITRO_HOST`, `NITRO_PORT`, `PORT`,
   `STIR_ENV_FILE`, the watchdog settings and `NODE_ENV=production`. A key
   already in the environment is never replaced by `.env`, and `start.mjs`
   forces `NODE_ENV=production`.
2. `shared/.env`, for every other key.
3. Values frozen into the build from `nuxt.config.ts`, which a `NUXT_*`
   variable matching a `runtimeConfig` path overrides at runtime (below).

Nuxt reads the environment only when the process starts. To apply an `.env`
edit, restart the site's units:

```bash
sudo stir nuxt restart <user>
```

A deploy restarts them too (capistrano-stir `app:restart_nuxt`, which runs
after `deploy:published` and on its own as `cap <stage> app:restart_nuxt`).
Varnish keeps serving cached pages, so purge the site when the change affects
rendered HTML or public runtime config.

Locally, DDEV runs the Nuxt dev server as the `nuxt` daemon
(`web_extra_daemons`), and `nuxi dev` reads the Nuxt project's own `.env`.
Restart it after an `.env` edit:

```bash
ddev exec supervisorctl restart webextradaemons:nuxt
```

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

Of the layer's documented names, only `DRUPAL_API_KEY` and
`PROTECTED_PASSWORD` are the third kind: server code reads them from
`process.env` (`stirServerEnv`) and falls back to the build value. The others
(`TURNSTILE_SECRET`, `DRUPAL_REQUEST_TIMEOUT_MS`, …) set build-time defaults
only.

### Settings apps expect to change on restart

| Documented name | runtimeConfig path | Name that overrides it at runtime today |
| --- | --- | --- |
| `DRUPAL_API_KEY` | `apiKey` | Same name (read at runtime), or `NUXT_API_KEY` |
| `PROTECTED_PASSWORD` | `protectedPassword` | Same name (read at runtime), or `NUXT_PROTECTED_PASSWORD` |
| `TURNSTILE_SECRET` | `turnstile.secretKey` | `NUXT_TURNSTILE_SECRET_KEY`, only if set at build |
| `TURNSTILE_KEY` | `public.turnstile.siteKey` | `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, only if set at build |
| `NUXT_SITE_URL` | `siteUrl`, `site.url` | `NUXT_SITE_URL` (covers both) |
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
- `DRUPAL_URL`: also shapes image providers, route rules and
  SEO proxying at build. Overriding only `NUXT_API` or the Drupal CE base URLs
  at runtime would leave those pointing at the old host, so change Drupal
  hosts with a deploy.
- `NUXT_IMAGE_CDN`, `NUXT_SITE_NAME` (nuxt-site-config
  also reads `NUXT_SITE_NAME` at runtime for `site.name`), the Vite dev host
  (the `NUXT_SITE_URL` host, else `localhost`) and `NODE_ENV`.
- `DRUPAL_CDN` (optional): a public file host that differs from
  `NUXT_IMAGE_CDN`, trusted as an IPX source. `NUXT_IMAGE_CDN`'s host is
  trusted already, so most sites leave it unset; see
  [theme-layer.md](theme-layer.md#nuxt-image-delivery).

The keys generated `.env` files contain today (`NUXT_ENV`,
`NUXT_INDEXABLE`, `NUXT_IMAGE_CDN`) match no `runtimeConfig` path,
so passing them to the process changes nothing in the layer. Downstream server
code that reads `process.env` directly does see them.

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
example `NUXT_TURNSTILE_SECRET_KEY="${TURNSTILE_SECRET}"`. `app-env.cjs`
expands `${VAR}`, so editing `TURNSTILE_SECRET` and restarting updates both
(the Turnstile names still need a value at build, as noted above).
