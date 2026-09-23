# Presentation choices: Surface, Variant and rich-text classes

Editors style CMS content by picking choices; code owns every class. The goal of
any change here is identical rendered output with a simpler system. Stir uses
Tailwind and Nuxt UI only; Bootstrap classes in old content are legacy and do
nothing.

## Where a project declares anything special

`stirTheme.presentation` in the project's `app.config.ts` (or any Nuxt layer it
extends; the build merges all layers, nearest first):

```ts
stirTheme: {
  presentation: {
    surfaces: {
      spotlight: { label: 'Spotlight', class: 'dp-spotlight' },
    },
    variants: {
      'grid-card': { label: 'Grid card', class: 'p-7 lg:p-12 border' },
    },
    richText: ['mb-4', 'text-center'],
    manifest: false,
  },
},
```

- `surfaces`: section backgrounds and colour schemes editors can pick.
- `variants`: named section designs editors can pick, including behaviour
  switches Vue code reads (the layer's `action-group` variants).
- `class`: Tailwind utilities and Nuxt UI tokens, or a project class defined in
  `app/assets/css/custom/`, or both. Every declared class is compiled.
- IDs are stable, lowercase `[a-z0-9_-]` keys that Drupal stores. Change a
  `label` freely; changing a `class` restyles all content using that ID.
- `richText`: every Tailwind utility that appears inside rich text (added
  through source editing). Required once `manifest` is `false`.
- `manifest: false`: set only after the site's content stores no free-text
  classes (see migration below). The build then needs nothing from Drupal.

Already provided by the layer, do not redeclare: surfaces `default`, `muted`,
`inverted`; variants `action-group`, `action-group-center`,
`action-group-right`.

Do not declare: classes used in the project's own Vue components or CSS
(Tailwind scans them), or grid, gap, spacing, width and alignment options (the
layer compiles all of them through `layoutVocabulary()`).

## Rules

- Never style content by typing classes into `field_classes` or rich text, and
  never add a safelist or `@source inline` in project CSS for CMS content. Add a
  surface, variant or `richText` entry instead.
- Never branch Vue code on arbitrary class names from content. Model the switch
  as a variant and read the resolved classes, as `Paragraph/Layout.vue` does.
- Leave rich-text markup as it is: sites rely on iframes, embeds, inline styles
  and custom elements, so do not add an HTML filter to "clean" classes.
- Removing an option leaves content that uses it selectable as "(no longer
  offered)" and flagged on Drupal's status report; migrate that content first.

## How choices reach Drupal and render

1. Nuxt serves IDs and labels at `/api/stir/presentation-catalogue`.
2. After every deploy, capistrano-stir runs
   `drush stir-layout:presentation-catalogue-refresh`; Drupal keeps the copy in
   State and its Surface and Variant fields offer it. A new option appears in
   Drupal only after the Nuxt code declaring it is deployed.
3. Drupal sends the stored IDs as the `surface` and `presentation_variant`
   Custom Elements attributes (`field_surface`, `field_presentation_variant`).
4. `Paragraph/Layout.vue` resolves them with `resolvePresentationClasses()` to
   the declared classes; with no known choice, legacy `classes` still apply.

## Migrating a site off free-text classes

The acceptance test is a before/after comparison of the rendered HTML of every
affected page; the only allowed differences are removed classes with no CSS.

1. Snapshot the rendered HTML of every page with `field_classes` or rich-text
   Tailwind utilities, on the target environment, before any change.
2. List the distinct `field_classes` values and classify each against the
   project's real Tailwind setup: project CSS class, Tailwind utility, or no
   effect. Declare surfaces and variants whose `class` is exactly the stored
   string, and list rich-text utilities in `richText`.
3. Write `config/presentation-classes.map.yml` (value to `{ surface, variant }`,
   `{  }` to drop a no-effect value) and dry-run
   `drush stir-layout:presentation-classes-migrate --map=… --dry-run` against the
   real server's content; local databases drift.
4. Deploy step A: fields, exported config and catalogue, no content change.
   Compare pages.
5. Deploy step B: a `hook_deploy_NAME()` in the site module runs the migrator
   with the map, the Nuxt project sets `manifest: false`, and the CMS
   `config/deploy.rb` sets `set :drupal_manifest_sensitive_paths, []`. Compare
   pages.

DancePlug was migrated this way first (2026-09-23). Check a site's
`app.config.ts` before assuming it has: other sites may still use the manifest.
