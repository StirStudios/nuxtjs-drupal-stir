# Design System Guidance

This layer uses Nuxt UI 4 and Tailwind CSS 4. Downstream projects should keep
brand styling flexible while preserving shared component behavior.

## Nuxt UI

- Prefer semantic colors: `primary`, `secondary`, `success`, `info`,
  `warning`, `error`, and `neutral`.
- Prefer valid Nuxt UI variants such as `solid`, `outline`, `soft`, `subtle`,
  `ghost`, and `link`.
- Use `ui` config for reusable component defaults.
- Use `class` or stable class hooks for one-off project styling.

## Tailwind

- Prefer semantic Nuxt UI utility classes such as `text-default`,
  `text-muted`, `bg-default`, `bg-muted`, `border-default`, and
  `border-muted`.
- Keep raw palette classes project-specific unless they are intentional brand
  tokens.
- Keep shared CSS in focused files under `app/assets/css/custom/`; use
  `app/assets/css/custom.css` as the import index.

## Drupal CE

- Keep custom-element component names aligned with Drupal elements.
- Put globally reused Drupal CE renderers in `components/global`.
- Document required Drupal fields or custom element payload changes in docs.

## Escape hatches

Raw class strings are allowed in `stirTheme` because downstream projects need
brand control. Prefer adding typed config for known behavior and leaving class
strings as styling escape hatches.
