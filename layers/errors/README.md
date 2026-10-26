# Stir errors capability

This optional layer reports errors to the site's GlitchTip (a Sentry-compatible
error tracker). It does nothing until the site sets `NUXT_PUBLIC_ERRORS_DSN`
(`https://<key>@errors.example.com/<project id>`), so extending it is safe on
every site before any is switched on.

- **Server and browser:** one small reporter (`utils/errorReport.ts`, outside
  the auto-imported folders so its names stay out of sites' auto-imports)
  sends errors with a plain `fetch` to GlitchTip's envelope endpoint: no SDK, no
  extra dependency, nothing downloaded. The server reports errors with status
  500 and up (render and API failures); the browser reports uncaught errors,
  unhandled rejections and Vue errors, and only once consent allows
  non-essential scripts (the same policy as analytics). Only the path leaves
  the server or the page (never the query string, cookies or request bodies,
  and no headers except the user agent on a failed module load, below), the
  same error counts once a minute, a runaway loop is capped, and
  scripts from other sites and browser extensions are ignored. Crawlers, page
  checkers and automated browsers (by user agent or `navigator.webdriver`) send
  nothing from the browser; the server only reports status 500 and up, so
  their 404s never count. Nor does the CMS's Maintenance mode during a deploy:
  a 503 that carries Drupal's maintenance message (plain text, passed on as
  `data.maintenanceMessage`) is not reported, from the server or the browser,
  while a 503 without it (a CMS that is down, answering with a proxy's HTML
  page) still is. The browser sends an error only when at least one
  stack frame is in the site's own built scripts (`/_nuxt/`, following the base
  path and CDN settings); code injected by an in-app browser or an extension
  (its source is the page address or another origin) and errors with no frames,
  such as a failed script load, are dropped. A thrown string is judged by the
  location the browser reported for it, never by the reporter's own stack.
- **Failed module loads:** an error such as "Importing a module script
  failed" or "Failed to fetch dynamically imported module", and only such an
  error, also carries:
  - the browser's user agent (as the event's `User-Agent`, which GlitchTip
    reads as browser and OS) and whether it is an in-app browser, such as an
    app's iPhone web view or the Facebook, Instagram or Google app;
  - the site's own files that came back with an error or no body, and those
    the page asked for (its `modulepreload` links) that never arrived, which
    is how a cancelled load shows on iPhones, where Safari keeps no record of
    it (file names only, no query string);
  - the protocols (h2, h3) the site's files used, and the connection type
    where the browser reports one (Safari does not);
  - the page's state: whether it was visible, whether the device was online,
    how long after the page started it happened, and how the page was opened
    (`navigate`, `reload`, `back_forward`).

  Nothing else about the visitor is sent. Stack traces from the browser are
  minified; there are no source maps.
- **Environment and release:** `NUXT_PUBLIC_ERRORS_ENVIRONMENT` (defaults to
  `NUXT_ENV`) and `NUXT_PUBLIC_ERRORS_RELEASE` (the deployed revision, so an
  error maps to a deploy).

Turning it on for a live site: set the DSN in the site's runtime `.env`
(`shared/.env`; no rebuild), restart the site (`stir nuxt restart <site>`),
then clear that site's Nuxt Varnish cache, or cached pages keep the empty
setting until they expire (`varnishadm -n /var/lib/varnish-nuxt ban
'obj.http.X-Host ~ "example.com$"'`).

Name the GlitchTip project after the site's system user (for example
`examplesite`): the Stir dashboard matches a site's open errors to its project by
that name. Drupal sites report PHP errors with the Raven module instead.

It is included by the full compatibility preset and excluded from the minimal
renderer.
