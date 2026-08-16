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

Every build consumes Drupal's presentation usage manifest and compiles only the
semantic recipes and safe class tokens that the site currently uses. There is
no compatibility mode or general-purpose utility safelist.

The widened safe-token grammar is manifest schema version 2. During an
independent rollout, deploy the schema-v2 Nuxt consumer before updating Drupal.

- By default Nuxt reads
  `${DRUPAL_URL}/ce-api/stir-layout-builder/presentation-manifest` and uses
  `DRUPAL_API_KEY` when configured.
- `STIR_PRESENTATION_MANIFEST` may override the endpoint with another URL or a
  local JSON file exported with `drush stir-layout:presentation-manifest`.
- `STIR_PRESENTATION_MANIFEST_API_KEY` may override the API key for that URL.
- `STIR_PRESENTATION_MANIFEST_FIXTURE=1` explicitly uses the layer's validated,
  version-matched fixture for downstream quality/test workflows that do not
  connect to Drupal. Do not set it for deployment builds.
- `STIR_PRESENTATION_MANIFEST_LAST_KNOWN` optionally identifies an explicitly
  approved local fallback when the primary source is unavailable.

Builds fail when the manifest is missing, invalid, uses an unknown semantic
value, contains an unsafe accepted class token, or has a mismatched revision.
Rejected historical class values are omitted and reported as a warning. Ordinary
Tailwind utilities, responsive/state variants, slash modifiers such as
`border-white/10`, bounded safe bracket utilities, and project CSS hooks are
preserved. Bracket values containing unsafe CSS sources such as `url(...)`
remain rejected. The verified Drupal revision remains available in
public runtime config as `stirPresentationManifestRevision`.
`stirPresentationBuild` records the manifest and generated-source revisions,
manifest usage count, generated utility count and source bytes,
accepted/rejected class-token counts, generation duration, schema version,
site UUID, and Drupal theme.

The same non-secret build identity is exposed at `/api/health` as
`presentation`. Deployment monitoring can compare its `manifestRevision` with
Drupal's `ETag` or `X-Stir-Presentation-Revision` header. A difference means a
new Nuxt build is required before a newly introduced utility can have compiled
CSS. Deployment automation should use that revision change as its rebuild
trigger; the health request itself does not query Drupal or trigger deployment.
