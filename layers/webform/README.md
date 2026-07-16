# Stir Webform capability

This optional vNext layer owns the Webform submission endpoint, submission
limits, Webform rendering components, and Cloudflare Turnstile integration.

The full compatibility preset includes it. The minimal preset does not expose
the Webform submission route or load the Turnstile Nuxt module.

The shared widget default is `appearance: 'interaction-only'`: validation stays
enabled, while Cloudflare requests visible interaction only when needed.
Downstream projects may override the appearance through `stirTheme.turnstile`.
