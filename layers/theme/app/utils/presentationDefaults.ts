import type { StirPresentationCatalogue } from './presentationClasses'

/**
 * Surface and Variant choices every project offers. Projects add their own in
 * `stirTheme.presentation`. The build compiles all of these classes.
 */
export const STIR_PRESENTATION_DEFAULTS = {
  surfaces: {
    default: { label: 'Default', class: 'bg-default' },
    muted: { label: 'Muted', class: 'bg-muted' },
    inverted: { label: 'Inverted', class: 'bg-inverted text-inverted' },
  },
  variants: {
    'action-group': { label: 'Action group', class: 'action-group' },
    'action-group-center': { label: 'Action group, centred', class: 'action-group action-group--center' },
    'action-group-right': { label: 'Action group, right', class: 'action-group action-group--right' },
  },
} satisfies Required<StirPresentationCatalogue>
