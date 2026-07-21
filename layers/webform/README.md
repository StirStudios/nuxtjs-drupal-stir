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

The layer composes the shared website platform plus mandatory Turnstile
protection; it does not load auth, SEO, editorial, analytics, scripts, or
integrations. A later form/field boundary will allow Webform-only consumers to
use the foundation without the complete website renderer.

The shared widget default is `appearance: 'interaction-only'`: validation stays
enabled, while Cloudflare requests visible interaction only when needed.
Downstream projects may override the appearance through `stirTheme.turnstile`.

## Payload boundary

`WebformForm` normalizes and validates the Drupal payload once through
`normalizeWebformDefinition`. Field components consume only that canonical
shape; they do not repeat boolean, cardinality, property-name, or field-type
coercion.

Submission field names, composite keys, and selected option values are sent
back to Drupal exactly as provided. Never apply generic snake-case or
camel-case conversion to submission data. The only scalar wire conversion is
boolean values to Drupal's `1` and `0` representation.

The versioned producer schema and fixtures are mirrored under
`contracts/stir-tools/v1`. Compatibility aliases in the boundary exist for
older Stir Tools payloads and should not be used by presentation components.
