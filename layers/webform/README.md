# Stir Webform capability

This optional vNext layer owns the Webform submission endpoint, submission
limits, Webform rendering components, and Cloudflare Turnstile integration.

The full compatibility preset includes it. The minimal preset does not expose
the Webform submission route or load the Turnstile Nuxt module.

Capability-focused downstream applications may consume it directly:

```ts
export default defineNuxtConfig({
  extends: ['@stir/base/layers/webform/nuxt.config'],
})
```

The layer composes mandatory Turnstile protection and the shared platform; it
does not load auth, SEO, editorial, analytics, scripts, or integrations.

The shared widget default is `appearance: 'interaction-only'`: validation stays
enabled, while Cloudflare requests visible interaction only when needed.
Downstream projects may override the appearance through `stirTheme.turnstile`.
