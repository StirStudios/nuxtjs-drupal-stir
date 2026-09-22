# Stir analytics capability

This optional layer owns Plausible module registration, runtime configuration,
and the consent-aware tracker bridge. The bridge is the only code that loads
`@plausible-analytics/tracker`: it fetches it on demand once tracking is
enabled and consent allows it, and this layer removes `@nuxtjs/plausible`'s own
client plugin, which would put the tracker in the initial bundle. The module's
`useTrackEvent`, `useTrackPageview`, proxy handler and preconnect plugin still
apply. It is included by the full compatibility
preset and excluded from the minimal renderer.
