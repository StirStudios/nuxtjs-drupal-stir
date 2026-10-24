# Stir errors capability

This optional layer reports errors to the site's GlitchTip (a Sentry-compatible
error tracker). It does nothing until the site sets `NUXT_PUBLIC_ERRORS_DSN`
(`https://<key>@errors.example.com/<project id>`), so extending it is safe on
every site before any is switched on.

- **Server and browser:** one small reporter (`shared/utils/errorReport.ts`)
  sends errors with a plain `fetch` to GlitchTip's envelope endpoint: no SDK, no
  extra dependency, nothing downloaded. The server reports errors with status
  500 and up (render and API failures); the browser reports uncaught errors,
  unhandled rejections and Vue errors, and only once consent allows
  non-essential scripts (the same policy as analytics). Only the path leaves
  the server or the page (never the query string, headers, cookies or request
  bodies), the same error counts once a minute, a runaway loop is capped, and
  scripts from other sites and browser extensions are ignored. Stack traces
  from the browser are minified; there are no source maps.
- **Environment and release:** `NUXT_PUBLIC_ERRORS_ENVIRONMENT` (defaults to
  `NUXT_ENV`) and `NUXT_PUBLIC_ERRORS_RELEASE` (the deployed revision, so an
  error maps to a deploy).

Name the GlitchTip project after the site's system user (for example
`danceplug`): the Stir dashboard matches a site's open errors to its project by
that name. Drupal sites report PHP errors with the Raven module instead.

It is included by the full compatibility preset and excluded from the minimal
renderer.
