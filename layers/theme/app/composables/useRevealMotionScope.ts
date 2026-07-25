import type {
  ComputedRef,
  InjectionKey,
  MaybeRefOrGetter,
} from 'vue'
import { toValue } from 'vue'

type RevealMotionScope = {
  effect: ComputedRef<string | undefined>
  stagger: ComputedRef<boolean>
  takeIndex: () => number
}

type RevealMotionScopeOptions = {
  stagger?: MaybeRefOrGetter<boolean | undefined>
}

const revealMotionScopeKey: InjectionKey<RevealMotionScope> =
  Symbol('stirRevealMotionScope')

const INHERITED_REVEAL_EFFECTS = new Set(['', 'inherit', 'default', 'unset'])
const DISABLED_REVEAL_EFFECTS = new Set(['none', 'off', 'false', '0'])

function normalizeScopeEffect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, '-')

  return normalized || undefined
}

export function resolveScopedRevealEffect(
  explicitEffect: unknown,
  inheritedEffect?: string,
): string | undefined {
  const explicit = normalizeScopeEffect(explicitEffect)

  if (isInheritedRevealEffect(explicit)) {
    return inheritedEffect
  }

  if (!explicit) return inheritedEffect

  return DISABLED_REVEAL_EFFECTS.has(explicit) ? undefined : explicit
}

export function isInheritedRevealEffect(value: unknown): boolean {
  const normalized = normalizeScopeEffect(value)

  return !normalized || INHERITED_REVEAL_EFFECTS.has(normalized)
}

export function provideRevealMotionScope(
  effect: MaybeRefOrGetter<string | undefined>,
  options: RevealMotionScopeOptions = {},
): RevealMotionScope {
  let nextIndex = 0
  const scope: RevealMotionScope = {
    effect: computed(() => normalizeScopeEffect(toValue(effect))),
    stagger: computed(() => toValue(options.stagger) === true),
    takeIndex: () => nextIndex++,
  }

  provide(revealMotionScopeKey, scope)

  return scope
}

export function useRevealMotionScope(
  explicitEffect: MaybeRefOrGetter<string | undefined>,
) {
  const inheritedScope = inject(revealMotionScopeKey, null)
  const scopeIndex = inheritedScope?.takeIndex() ?? 0
  const isInherited = computed(() =>
    isInheritedRevealEffect(toValue(explicitEffect)))
  const effect = computed(() =>
    resolveScopedRevealEffect(
      toValue(explicitEffect),
      inheritedScope?.effect.value,
    ))
  const staggerIndex = computed(() =>
    inheritedScope?.stagger.value === true ? scopeIndex : 0)

  return {
    effect,
    isInherited,
    staggerIndex,
  }
}
