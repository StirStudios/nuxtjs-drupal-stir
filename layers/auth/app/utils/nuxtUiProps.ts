import type { UButton } from '#components'

type ComponentProps<T> = T extends new () => { $props: infer P } ? P : never

type ButtonProps = ComponentProps<typeof UButton>

export type UiColor = Extract<NonNullable<ButtonProps['color']>, string>
export type UiButtonVariant = Extract<NonNullable<ButtonProps['variant']>, string>

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

export function resolveUiButtonVariant(
  value: unknown,
  fallback = 'solid' as UiButtonVariant,
): UiButtonVariant {
  return resolveStringProp(value, fallback)
}
