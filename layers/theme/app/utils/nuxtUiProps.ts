export const uiColors = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const

export const uiButtonVariants = [
  'link',
  'solid',
  'outline',
  'soft',
  'subtle',
  'ghost',
  'material',
] as const

export const uiFieldVariants = [
  'outline',
  'soft',
  'subtle',
  'ghost',
  'none',
  'material',
] as const

export const uiFieldNoMaterialVariants = [
  'outline',
  'soft',
  'subtle',
  'ghost',
  'none',
] as const

export const uiSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const

export type UiColor = (typeof uiColors)[number]
export type UiButtonVariant = (typeof uiButtonVariants)[number]
export type UiFieldVariant = (typeof uiFieldVariants)[number]
export type UiFieldNoMaterialVariant = (typeof uiFieldNoMaterialVariants)[number]
export type UiSize = (typeof uiSizes)[number]

function includesLiteral<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && values.includes(value)
}

export function resolveUiColor(
  value: unknown,
  fallback: UiColor = 'primary',
): UiColor {
  return includesLiteral(uiColors, value) ? value : fallback
}

export function resolveUiButtonVariant(
  value: unknown,
  fallback: UiButtonVariant = 'solid',
): UiButtonVariant {
  return includesLiteral(uiButtonVariants, value) ? value : fallback
}

export function resolveUiFieldVariant(
  value: unknown,
  fallback: UiFieldVariant = 'outline',
): UiFieldVariant {
  return includesLiteral(uiFieldVariants, value) ? value : fallback
}

export function resolveUiFieldNoMaterialVariant(
  value: unknown,
  fallback: UiFieldNoMaterialVariant = 'outline',
): UiFieldNoMaterialVariant {
  return includesLiteral(uiFieldNoMaterialVariants, value) ? value : fallback
}

export function resolveUiSize(
  value: unknown,
  fallback: UiSize = 'md',
): UiSize {
  return includesLiteral(uiSizes, value) ? value : fallback
}
