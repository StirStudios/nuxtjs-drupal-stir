# Component Selection

Prefer Nuxt UI primitives and shared Drupal CE components before adding
project-only components.

## Rules

- Use Nuxt UI components for buttons, forms, overlays, navigation, alerts,
  empty states, skeletons, cards, and layout primitives.
- Use Drupal CE custom-element components for Drupal-rendered content.
- Use `WrapDiv` and `WrapGrid` when Drupal layout needs optional wrappers.
- Do not make `WrapDiv` render a wrapper just to carry listeners or attrs; move
  listeners to an existing concrete element instead.
- Use project overrides when content or markup is project-specific.

## Examples

- Form inputs: `UInput`, `UTextarea`, `USelect`, `UCheckbox`, `URadioGroup`.
- Loading states: `USkeleton`.
- Empty/error states: `UEmpty`.
- Dialogs and media previews: `UModal`.
- Header/nav: `UNavigationMenu` and shared `AppHeader` configuration.

## Drupal views

Keep view control behavior in `useDrupalViewControls` and keep rendering in
`drupal-view--default.vue`. If new behavior is needed, add pure helpers and
tests before wiring it into the component.
