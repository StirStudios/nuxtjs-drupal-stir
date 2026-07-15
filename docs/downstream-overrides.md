# Downstream Overrides

Use configuration before overriding components. Override components only when a
project needs markup, content, or behavior that should not live in the shared
layer.

## Preferred order

1. `app.config.ts` for shared layer knobs such as `stirTheme`, `auth`,
   `privacyNotice`, `analytics`, and `colorMode`.
2. Nuxt UI `ui` config for component defaults, slots, variants, and semantic
   colors.
3. Project CSS for stable shared hooks and project-only styling.
4. Component override when markup or behavior must be project-specific.

## Common overrides

Transparent split-logo header:

```ts
export default defineAppConfig({
  stirTheme: {
    navigation: {
      mode: 'fixed',
      transparentAtTop: true,
      desktopLayout: 'split-logo',
      logoMenuMarker: '--logo--',
      color: 'primary',
      variant: 'link',
    },
  },
})
```

Footer atom ordering:

```ts
export default defineAppConfig({
  stirTheme: {
    footer: {
      layout: 'stacked',
      sections: {
        center: ['logo', 'menu', 'socials', 'email', 'legal'],
      },
    },
  },
})
```

Project-specific footer CTAs should use `app/components/App/Footer.vue` in the
downstream project. Do not add project CTAs back to the shared footer contract.

Webform styling:

```ts
export default defineAppConfig({
  stirTheme: {
    webform: {
      fieldVariant: 'material',
      submitButtonSize: 'xl',
      submitAlign: 'flex justify-center',
    },
  },
})
```

## Smoke checklist after layer updates

- Homepage loads.
- One inner Drupal CE route loads.
- Header/menu links render correctly.
- Drupal views with filters, sort, and pagination work.
- View Paragraph payloads should include `paragraphId`; interactive controls
  then refresh only `/api/view/{paragraphId}`. Full-page refresh remains a
  compatibility fallback for older Drupal payloads.
- App-context edit links appear when authenticated.
- Webform submit proxy still works.

## CMS presentation manifest

The default `compatibility` mode keeps the complete finite Drupal utility
safelist while a project is migrated. Set these build variables to compile the
smaller project-specific source:

- `STIR_PRESENTATION_MANIFEST_MODE=hybrid` uses the CMS `used` set plus a small
  editorial reserve. `strict` uses only used values plus structural layout
  recipes.
- `STIR_PRESENTATION_MANIFEST` is an authenticated Drupal endpoint URL or a
  local JSON file exported with `drush stir-layout:presentation-manifest`.
- `STIR_PRESENTATION_MANIFEST_API_KEY` is sent only for an HTTP source.
- `STIR_PRESENTATION_MANIFEST_LAST_KNOWN` optionally identifies an explicitly
  approved local fallback when the primary source is unavailable.

Hybrid and strict builds fail when the manifest is missing, invalid, uses an
unknown semantic value, contains a rejected legacy utility, or has a mismatched
revision. The verified revision is recorded in public runtime config as
`stirPresentationManifestRevision`.

The checked fixture build reduces the main CSS artifact from approximately
35.15 kB gzip in compatibility mode to 30.03 kB in strict mode (about 14.6%).
Each project's result depends on its actual manifest; this fixture is a
regression measurement, not a promised production size.
