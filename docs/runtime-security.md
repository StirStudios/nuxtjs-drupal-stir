# Runtime Security and Proxy Configuration

This layer keeps browser-facing Drupal configuration separate from server-only
credentials. All values below are runtime-safe defaults unless a deployment
explicitly overrides them.

## Drupal Origins and API Keys

- `DRUPAL_URL` is the Drupal origin used by browser and Nitro requests,
  including `drupalBaseUrl`, `menuBaseUrl`, sitemap sources, and custom server
  calls.
- `DRUPAL_API_KEY` is server-only. Automatic injection is restricted to the
  internal `/api/drupal-ce/*` and `/api/menu/*` proxies. Custom auth, account,
  paragraph, CSRF, and webform calls attach the key explicitly.
- `DRUPAL_REQUEST_TIMEOUT_MS` controls custom Nitro-to-Drupal requests and
  defaults to `10000`.
- `DRUPAL_SESSION_COOKIE_NAMES` is an optional comma-separated server-only
  allowlist for sites that override Drupal's normal session cookie name.

The Drupal CE module also supports deployment-time public runtime overrides:

- `NUXT_PUBLIC_DRUPAL_CE_DRUPAL_BASE_URL`
- `NUXT_PUBLIC_DRUPAL_CE_SERVER_DRUPAL_BASE_URL`
- `NUXT_PUBLIC_DRUPAL_CE_MENU_BASE_URL`
- `NUXT_PUBLIC_DRUPAL_CE_CE_API_ENDPOINT`

Use these only when a built deployment must change the corresponding module
URL or endpoint. All Drupal CE module URL and endpoint overrides are serialized
into public runtime config, including `SERVER_DRUPAL_BASE_URL`; do not use
credentials, secret-only hostnames, or other sensitive topology in these
values.

Only Drupal session cookies matching the standard `SESS*` or `SSESS*` naming
contract, or an explicit `DRUPAL_SESSION_COOKIE_NAMES` entry, are forwarded
upstream or returned to the browser. Responses involving a Drupal session are
marked `private, no-store, max-age=0`. Expected Drupal
4xx contract messages are preserved for form feedback; upstream 5xx details are
replaced with a generic message.

The layer-owned `/api/drupal-ce` and `/api/menu` handlers preserve the
`nuxtjs-drupal-ce` public proxy contract while filtering cookies through H3's
proxy request and response hooks. Downstream applications do not need a new
route or compatibility configuration. Proxy paths stay confined to the
configured CE/menu endpoints, forwarding headers are removed, and upstream
redirects are returned without following them with server credentials.

Cookie-authenticated account mutations and paragraph updates enforce the
`NUXT_URL` origin at the Nuxt boundary. Browser requests must provide a matching
`Origin`/`Referer` or a browser-generated `Sec-Fetch-Site: same-origin` signal.
Public login, registration, password-request, and Webform routes keep their
existing Turnstile/token contracts.

Drupal `stir_account` Flood limits use Symfony's resolved client IP. To avoid
collapsing all visitors onto the Nitro proxy address, auth/account calls can
forward one normalized IP with:

- `DRUPAL_FORWARD_CLIENT_IP=true`
- `DRUPAL_TRUST_PROXY=true` only when a trusted ingress strips client-provided
  forwarding headers and writes its own value

Symfony/Drupal must trust only the Nuxt proxy address before it consumes the
forwarded header. Leave forwarding disabled until both proxy boundaries are
configured. The raw inbound `X-Forwarded-For` header is never copied directly.

## Protected-Page Access

Production protected-page access requires all of:

- `PROTECTED_PASSWORD`
- `PROTECTED_COOKIE_SECRET`, set to a separate high-entropy random secret
- `TURNSTILE_KEY`
- `TURNSTILE_SECRET`

Do not reuse `PROTECTED_PASSWORD` as the cookie-signing secret. Development can
fall back to the password for convenience, but production intentionally refuses
that fallback. Cookie signatures are bound to both values, so rotating either
`PROTECTED_PASSWORD` or `PROTECTED_COOKIE_SECRET` immediately invalidates
existing protected-access cookies.

Failed protected-login attempts use Nitro's `cache` storage with these defaults:

| Variable | Default | Purpose |
| --- | ---: | --- |
| `PROTECTED_RATE_LIMIT_ENABLED` | `true` | Enables the application limiter |
| `PROTECTED_RATE_LIMIT_MAX_ATTEMPTS` | `5` | Failures allowed per client window |
| `PROTECTED_RATE_LIMIT_WINDOW_SECONDS` | `900` | Window and storage TTL |
| `PROTECTED_RATE_LIMIT_TRUST_PROXY` | `false` | Allows `X-Forwarded-For` IP resolution |

The Nitro limiter is best-effort. Shared `cache` storage provides cross-worker
visibility, but its read/modify/write counter is not atomic and rate limiting
fails open when storage is unavailable. Production must independently enforce
a persistent, atomic or provider-native edge limit on
`POST /api/auth/protected` using a trusted client-IP boundary.

Leave `PROTECTED_RATE_LIMIT_TRUST_PROXY=false` unless the application is behind
a trusted ingress that strips any client-supplied forwarding headers and sets
its own `X-Forwarded-For`. Blindly trusting that header lets clients rotate the
rate-limit identifier.

The Drupal `stir_account` module remains responsible for its own Flood API
limits. The local protected-page limiter does not replace Drupal auth limits.

## Webform Submission Limits

The webform proxy validates request, file, and field counts before forwarding a
submission to `stir_webform_rest`:

| Variable | Default | Purpose |
| --- | ---: | --- |
| `WEBFORM_MAX_REQUEST_BYTES` | `10485760` | Total request/parsed multipart bytes |
| `WEBFORM_MAX_FILE_BYTES` | `5242880` | Maximum bytes for one file |
| `WEBFORM_MAX_FILES` | `5` | Maximum uploaded files |
| `WEBFORM_MAX_FIELDS` | `100` | Maximum non-file multipart fields |

H3 buffers multipart data before application-level multipart checks. The Nuxt
checks are validation, not a pre-buffer memory cap. Production must reject
request bodies at or below `WEBFORM_MAX_REQUEST_BYTES` at the CDN, load
balancer, or ingress before they reach Nitro, including chunked multipart
requests.

The defaults are global safety ceilings, not replacements for Drupal element
configuration. Before rollout, compare them with the largest deployed Webform,
each upload element's `#max_filesize`/multiple-file behavior, and PHP/edge
limits. Raise the Nuxt values deliberately when a valid form exceeds a default,
then smoke-test that form; otherwise the proxy returns `413` before Drupal.

The proxy requires `webform_id` and `turnstile_response`, fetches a Drupal CSRF
token, and forwards the filtered Drupal session cookie consistently with both
the CSRF request and final submission. Drupal remains the authority that
verifies the Turnstile token and submission access.
