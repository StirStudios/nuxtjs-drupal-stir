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

Centred toggle header with project actions and page effects:

```ts
export default defineAppConfig({
  stirTheme: {
    clientComponents: ['AppPageTransition', 'AppCursor'],
    navigation: {
      desktopLayout: 'centered-toggle',
      actionsComponent: 'AppHeaderActions',
      toggleComponent: 'AppMenuToggleIcon',
      toggleClass: 'aria-expanded:opacity-0',
      slideover: {
        angle: true,
        content: '!bg-primary !text-inverted',
        portal: false,
        unmountOnHide: false,
      },
    },
  },
})
```

Call-to-action button and account menu taken from the last two Drupal main-menu
links:

```ts
export default defineAppConfig({
  stirTheme: {
    navigation: {
      actionItems: [
        { match: -2, as: 'button', mobile: 'button', color: 'secondary', size: 'lg' },
        { match: -1 },
      ],
    },
  },
})
```

Put the named components in `app/components/global/` so they resolve by name.
Keep brand copy, artwork and effects in those project components rather than
replacing `App/Header.vue`.

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

Rich text inline embeds:

`EditableRichText`, used by Text and Hero paragraphs, renders its trusted HTML
through `RichTextHtml`. To expand project-specific inline elements (for example
a `<stir-cta>` tag stored in Drupal text), add `app/components/RichTextHtml.vue`
with the same `html` prop. Keep one root element so wrapper classes and reveal
motion still apply, and keep plain HTML output unchanged when no embed is found.
Override the global `drupal-markup` component the same way for body fields.

Drupal view filter bars:

Do not fork `drupal-view--default.vue` to change filters. A fork loses SSR
`?page=N` resolution, crawlable pager links, the grid image profile and the
query namespace. Replace only the controls region with the `controls` slot:

```vue
<!-- app/components/global/drupal-view--default.vue -->
<script setup lang="ts">
import type { DrupalViewProps } from '#stir/types'

const props = defineProps<DrupalViewProps>()
</script>

<template>
  <DrupalViewDisplay v-bind="props">
    <template #rows>
      <slot name="rows" />
    </template>
    <template #controls="{ filters, filterValues, activeFilters, removeFilter, resetFilters, setFilter }">
      <div class="mb-6 flex flex-wrap gap-2">
        <UButton
          v-for="filter in activeFilters"
          :key="filter.key"
          :aria-label="filter.removeLabel"
          trailing-icon="i-lucide-x"
          variant="soft"
          @click="removeFilter(filter)"
        >
          {{ filter.label }}
        </UButton>
        <UButton v-if="activeFilters.length" variant="ghost" @click="resetFilters">
          Reset
        </UButton>
        <DrupalViewsFilters :filters="filters" :values="filterValues" @change="setFilter" />
      </div>
    </template>
  </DrupalViewDisplay>
</template>
```

The slot renders only when the view has exposed filters or sorts and is not a
carousel. Slot props are `DrupalViewControlsSlotProps` from `#stir/types`:

- State: `filters`, `filterValues`, `sort`, `sortByOptions`,
  `sortOrderOptions`, `sortValues`, `isLoading`.
- `activeFilters`: one entry per selected, non-empty filter value, with
  `filterKey`, `filterLabel`, the option `label`, `value`, and a `removeLabel`
  such as `Remove Category: News` for icon-only chip buttons. A date range is
  one entry.
- `setFilter({ key, value })` and `setSort({ key, value })` match the `change`
  events of `DrupalViewsFilters` and `DrupalViewsSort`.
- `removeFilter(activeFilter)` removes one value; `resetFilters()`,
  `resetSort()` and `resetControls()` restore the Drupal defaults for filters,
  sort, or both. Every action returns to the first page, updates the URL and
  refreshes the rows.

With the slot, the layer adds a visually hidden `role="status"` region that
announces loading, errors, and updated or empty results, so a custom bar does
not need its own. Keep visible labels on form controls and use `removeLabel`
when a chip shows only the value.

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

Route hero:

Enable the layout route hero with `stirTheme.routeHero.enabled: true` (see
`stirTheme.routeHero` in [stir-theme-config.md](./stir-theme-config.md)). Drupal pages whose
element is listed in `routeHero.elements` (default `node-page`) get a hero from
their Hero paragraph, and `node--page` no longer renders that paragraph inline.
Keep brand data in the project and supply it in the narrowest place:

```ts
// app/app.config.ts — static heroes, matched with the colorMode route patterns
export default defineAppConfig({
  stirTheme: {
    routeHero: {
      enabled: true,
      imageSelection: 'random', // SSR-stable pick among the page hero images
      routes: [
        { path: '/', title: 'Your connection to dance', titleLines: ['Your', 'Connection', 'To Dance'], variant: 'cover' },
        { path: '/instructors', eyebrow: 'Faculty', title: 'Online dance instructors' },
      ],
    },
  },
})
```

```ts
// A Nuxt-only page
definePageMeta({ routeHero: { title: 'Account', variant: 'simple' } })
// or suppress the hero on one route
definePageMeta({ routeHero: false })
```

```ts
// app/plugins/route-hero.ts — dynamic contexts. The factory runs in the hero's
// setup scope, so it may call composables; return a getter.
export default defineNuxtPlugin(() => {
  registerRouteHeroResolver(({ route, pageHero }) => {
    const { data } = useListingContext(() => route.path)

    return () => data.value
      ? { ...pageHero.value, title: data.value.label, surfaceClass: brandGradient(data.value.label) }
      : null // defer to route definitions and the Drupal page
  })
})
```

Precedence: route meta, registered resolvers, `routes`, then the Drupal page.
Route meta and `routes` entries merge over the Drupal page hero, so a
definition without an image keeps the page's image. Resolvers return a complete
model (spread `pageHero.value` to extend it) and `false` suppresses the hero.

Editorial detail pages render the same component with the overlap variant:

```vue
<script setup lang="ts">
const props = defineProps<{ title: string; summary?: string; image?: RouteHeroImage; variant: string }>()
const hero = computed(() => resolveEditorialRouteHero({
  title: props.title,
  summary: props.summary,
  image: props.image,
  mediaFirst: ['video', 'interview'].includes(props.variant),
}))
</script>

<template>
  <RouteHeroSection v-if="hero" :hero="hero">
    <template #media><slot name="featuredMedia" /></template>
    <EditorialMeta />
    <slot name="body" />
  </RouteHeroSection>
</template>
```

Media-first heroes render no backdrop image and place the `media` slot before
the heading, so the player keeps its own thumbnail. Otherwise the canonical
image is the backdrop and `media` follows the description. Use the `actions`
slot to replace the default `UButton`s, for example with analytics buttons.

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

## Presentation choices (Surface and Variant)

Editors style Layout paragraphs by picking a Surface and a Variant in Drupal
instead of typing classes. The choices, and the classes they render, live in
`app.config.ts`:

```ts
stirTheme: {
  presentation: {
    surfaces: {
      spotlight: { label: 'Spotlight', class: 'bg-muted/50 py-10 lg:py-20' },
    },
    variants: {
      'grid-card': { label: 'Grid card', class: 'p-7 lg:p-12 border' },
    },
    // Tailwind utilities used inside rich text.
    richText: ['mb-4', 'text-center'],
    // Once no content stores free-text classes.
    manifest: false,
  },
},
```

- The layer adds Default, Muted and Inverted surfaces and the `action-group`,
  `action-group-center` and `action-group-right` variants. Every declared class
  is compiled.
- `/api/stir/presentation-catalogue` serves the IDs and labels. Deploys run
  `drush stir-layout:presentation-catalogue-refresh`, so Drupal offers exactly
  what the deployed frontend renders.
- Drupal sends the choices as the `surface` and `presentation_variant`
  attributes. Without a known choice, the free-text `classes` still apply.
- Moving existing content: map each stored `field_classes` value to choices
  that render the same classes, then run
  `drush stir-layout:presentation-classes-migrate --map=<file>` (with
  `--dry-run` first). Compare rendered pages before and after.

## CMS presentation manifest

Every build compiles every option the layout fields offer, whether or not
content uses it yet: grid columns 1-12 and gaps 0-20 at every breakpoint, and
each spacing, width and alignment option. A value an editor picks for the first
time therefore has CSS without a rebuild. `layoutVocabulary()` generates this
set from the same recipes as the manifest, and a test checks it covers every
class the grid, alignment and width resolvers can produce.

The build also consumes Drupal's presentation usage manifest and compiles the
free-text class tokens (`field_classes`, classes in formatted text) the site
currently uses. There is no compatibility mode or general-purpose utility
safelist.

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
- `nuxi prepare`, which the starter runs as `postinstall`, also reads the
  manifest. On a new project, install with
  `pnpm install --frozen-lockfile --ignore-scripts`, install Drupal, then run
  `pnpm rebuild`. Stir Decoupled's `setup.sh` does this.

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

## Finding forks before they break a deploy

A site component whose resolved Nuxt name matches a layer component replaces
it silently, and then drifts from it. DancePlug's `AuthCard` fork drifted
until an upstream type change failed that site's deploy, which is the failure
mode this check exists to prevent.

```bash
pnpm audit:overrides /path/to/site-nuxt [...]
```

It prints each shadowed component with both line counts, for example:

```
  AuthCard: site 101 lines vs layer 166 (auth/app/components/Auth/AuthCard.vue)
```

Read the line counts as a triage signal, not a verdict:

- **Site file much smaller than the layer's** — usually a thin fork that
  exists for one or two differences. Add tokens upstream and delete it, as
  `stirTheme.auth.showLogo`, `logoClass` and `formUi` replaced DancePlug's
  `AuthCard`, and `stirTheme.node.pageContentClass` replaced its
  `node--page`.
- **Site file much larger** — usually a genuine site implementation, like
  Piper's `WebformContent` (302 lines against the layer's 171: widget runtime
  mode, step model and tab groups). Keep it, and keep its props and emits in
  step with the layer's.
- **Either way, an override must match the layer component's emit types.**
  That is what broke the deploy: the fork still said `event: unknown` after
  the layer emitted `FormSubmitEvent`.
