import type {
  UButton,
  UInput,
  UPageCard,
  USelect,
  UTextarea,
} from '#components'

type ComponentProps<T> = T extends new () => { $props: infer P } ? P : never

type ButtonProps = ComponentProps<typeof UButton>
type InputProps = ComponentProps<typeof UInput>
type PageCardProps = ComponentProps<typeof UPageCard>
type SelectProps = ComponentProps<typeof USelect>
type TextareaProps = ComponentProps<typeof UTextarea>

export type UiColor = Extract<NonNullable<ButtonProps['color']>, string>
export type UiButtonVariant = Extract<NonNullable<ButtonProps['variant']>, string>
export type UiFieldVariant = Extract<NonNullable<
  InputProps['variant'] | SelectProps['variant'] | TextareaProps['variant']
>, string>
export type UiFieldNoMaterialVariant = Exclude<UiFieldVariant, 'material'>
export type UiPageCardVariant = Extract<NonNullable<PageCardProps['variant']>, string>
export type UiSize = Extract<NonNullable<ButtonProps['size']>, string>

export type CarouselArrowButton = {
  color: UiColor
  variant: UiButtonVariant
  size: UiSize
}

export function resolveBooleanProp(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function resolveStringProp<T extends string>(
  value: unknown,
  fallback: T,
): T {
  return typeof value === 'string' && value.trim()
    ? value.trim() as T
    : fallback
}

export function resolveUiColor(
  value: unknown,
  fallback = 'primary' as UiColor,
): UiColor {
  return resolveStringProp(value, fallback)
}

export function resolveOptionalUiColor(value: unknown): UiColor | undefined {
  return typeof value === 'string' && value.trim()
    ? value.trim() as UiColor
    : undefined
}

export function resolveUiButtonVariant(
  value: unknown,
  fallback = 'solid' as UiButtonVariant,
): UiButtonVariant {
  return resolveStringProp(value, fallback)
}

export function resolveOptionalUiButtonVariant(value: unknown): UiButtonVariant | undefined {
  return typeof value === 'string' && value.trim()
    ? value.trim() as UiButtonVariant
    : undefined
}

export function resolveUiPageCardVariant(
  value: unknown,
  fallback = 'outline' as UiPageCardVariant,
): UiPageCardVariant {
  return resolveStringProp(value, fallback)
}

export function resolveUiFieldVariant(
  value: unknown,
  fallback = 'outline' as UiFieldVariant,
): UiFieldVariant {
  return resolveStringProp(value, fallback)
}

export function resolveUiFieldNoMaterialVariant(
  value: unknown,
  fallback = 'outline' as UiFieldNoMaterialVariant,
): UiFieldNoMaterialVariant {
  if (value === 'material') return fallback

  return resolveStringProp(value, fallback)
}

export function resolveUiSize(
  value: unknown,
  fallback = 'md' as UiSize,
): UiSize {
  return resolveStringProp(value, fallback)
}

export function resolveCarouselArrowButton(value?: {
  color?: unknown
  variant?: unknown
  size?: unknown
}): CarouselArrowButton {
  return {
    color: resolveUiColor(value?.color, 'neutral'),
    variant: resolveUiButtonVariant(value?.variant, 'outline'),
    size: resolveUiSize(value?.size, 'xl'),
  }
}
