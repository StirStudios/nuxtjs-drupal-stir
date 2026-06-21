import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { usePreferredReducedMotion, useSupported } from '@vueuse/core'
import { onMounted, toValue } from 'vue'

type RevealLike = {
  durationMs?: unknown
  staggerMs?: unknown
  ease?: unknown
  threshold?: unknown
  rootMargin?: unknown
}

export type RevealMotionResolved = {
  durationMs: number
  staggerMs: number
  ease: [number, number, number, number]
  threshold: number
  rootMargin: string
}

export type RevealStaggerMode = 'default' | 'dense'

type RevealMotionOptions = {
  ssrVisible?: boolean
}

const REVEAL_DEFAULTS = {
  durationMs: 800,
  staggerMs: 250,
  ease: [0.42, 0, 0.58, 1] as [number, number, number, number],
  threshold: 0,
  rootMargin: '0px 0px -10% 0px',
}

const DENSE_REVEAL_STAGGER_GROUP = 6
const DENSE_REVEAL_STAGGER_MS = 28
const DISABLED_REVEAL_EFFECTS = new Set(['none', 'off', 'unset', 'false', '0'])

type MotionEffectTarget = {
  opacity: number
  x?: number
  y?: number
  scale?: number
  rotateX?: number
  rotateY?: number
}

const REVEAL_HIDDEN_TARGETS: Record<string, MotionEffectTarget> = {
  'fade-in': { opacity: 0 },
  'fade-up': { opacity: 0, y: 100 },
  'fade-down': { opacity: 0, y: -100 },
  'fade-left': { opacity: 0, x: -100 },
  'fade-right': { opacity: 0, x: 100 },
  'flip-up': { opacity: 0, rotateX: 90 },
  'flip-down': { opacity: 0, rotateX: -90 },
  'flip-left': { opacity: 0, rotateY: -90 },
  'flip-right': { opacity: 0, rotateY: 90 },
  'slide-up': { opacity: 0, y: 100 },
  'slide-down': { opacity: 0, y: -100 },
  'slide-left': { opacity: 0, x: -100 },
  'slide-right': { opacity: 0, x: 100 },
  'zoom-in': { opacity: 0, scale: 0.8 },
  'zoom-out': { opacity: 0, scale: 1.2 },
  'zoom-in-up': { opacity: 0, y: 100, scale: 0.8 },
  'zoom-in-down': { opacity: 0, y: -100, scale: 0.8 },
  'zoom-in-left': { opacity: 0, x: -100, scale: 0.8 },
  'zoom-in-right': { opacity: 0, x: 100, scale: 0.8 },
  'zoom-out-up': { opacity: 0, y: 100, scale: 1.2 },
  'zoom-out-down': { opacity: 0, y: -100, scale: 1.2 },
  'zoom-out-left': { opacity: 0, x: -100, scale: 1.2 },
  'zoom-out-right': { opacity: 0, x: 100, scale: 1.2 },
}

const REVEAL_VISIBLE_TARGET: MotionEffectTarget = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotateX: 0,
  rotateY: 0,
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

function toCubicBezier(
  value: unknown,
  fallback: [number, number, number, number],
): [number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 4) return fallback

  const parsed = value.map((point) => Number(point))

  if (parsed.some((point) => !Number.isFinite(point))) return fallback

  return [parsed[0]!, parsed[1]!, parsed[2]!, parsed[3]!]
}

function toViewportMargin(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback
}

function normalizeRevealEffect(effect: string | undefined): string | undefined {
  if (typeof effect !== 'string') return undefined

  const normalized = effect.trim().toLowerCase()

  return normalized && !DISABLED_REVEAL_EFFECTS.has(normalized)
    ? normalized
    : undefined
}

export function useRevealConfig() {
  const theme = useAppConfig().stirTheme

  const raw = computed<RevealLike>(() => {
    return (theme.animations?.reveal || {}) as RevealLike
  })

  const resolved = computed<RevealMotionResolved>(() => ({
    durationMs: toFiniteNumber(raw.value.durationMs, REVEAL_DEFAULTS.durationMs),
    staggerMs: toFiniteNumber(raw.value.staggerMs, REVEAL_DEFAULTS.staggerMs),
    ease: toCubicBezier(raw.value.ease, REVEAL_DEFAULTS.ease),
    threshold: toFiniteNumber(raw.value.threshold, REVEAL_DEFAULTS.threshold),
    rootMargin: toViewportMargin(raw.value.rootMargin, REVEAL_DEFAULTS.rootMargin),
  }))

  return {
    resolved,
  }
}

export function useRevealMotionConfig() {
  const theme = useAppConfig().stirTheme
  const animateOnce = computed(() => theme.animations?.once !== false)
  const { resolved } = useRevealConfig()
  const preferredMotion = usePreferredReducedMotion()
  const supportsIntersectionObserver = useSupported(() => 'IntersectionObserver' in window)
  const hasMounted = ref(false)
  const revealMotionKey = ref(0)

  onMounted(() => {
    hasMounted.value = true
    revealMotionKey.value = 1
  })

  const getStaggerDelayMs = (index: number, startIndex: number = 0) => {
    return Math.max(0, index - startIndex) * Math.max(0, resolved.value.staggerMs)
  }

  const getRevealDelayMs = (
    index: number,
    options?: {
      mode?: RevealStaggerMode
      startIndex?: number
    },
  ) => {
    const mode = options?.mode ?? 'default'
    const startIndex = options?.startIndex ?? 0

    if (mode === 'dense') {
      return (Math.max(0, index - startIndex) % DENSE_REVEAL_STAGGER_GROUP) * DENSE_REVEAL_STAGGER_MS
    }

    return getStaggerDelayMs(index, startIndex)
  }

  const getRevealMotionProps = (
    effect?: string,
    delayMs: number = 0,
    options: RevealMotionOptions = {},
  ): Record<string, unknown> => {
    const shouldReduceMotion = preferredMotion.value === 'reduce'
    const shouldUseStaticReveal =
      shouldReduceMotion ||
      (import.meta.client && !supportsIntersectionObserver.value)

    if (shouldUseStaticReveal) {
      return { initial: false }
    }

    const resolvedDelay = Math.max(0, Number(delayMs || 0)) / 1000
    const ssrVisible = options.ssrVisible !== false

    const normalizedEffect = normalizeRevealEffect(effect)

    if (!normalizedEffect) {
      return { initial: false }
    }

    const initial = REVEAL_HIDDEN_TARGETS[normalizedEffect]

    if (!initial) {
      return { initial: false }
    }

    return {
      initial: ssrVisible && !hasMounted.value ? false : initial,
      whileInView: REVEAL_VISIBLE_TARGET,
      transition: {
        type: 'tween',
        duration: resolved.value.durationMs / 1000,
        ease: resolved.value.ease,
        delay: resolvedDelay,
      },
      inViewOptions: {
        once: animateOnce.value,
        amount: resolved.value.threshold,
        margin: resolved.value.rootMargin,
      },
      style: normalizedEffect.startsWith('flip-')
        ? { transformStyle: 'preserve-3d' }
        : undefined,
    }
  }

  const useRevealMotionProps = (
    effect: MaybeRefOrGetter<string | undefined>,
    delayMs: MaybeRefOrGetter<number | undefined> = 0,
    options: MaybeRefOrGetter<RevealMotionOptions | undefined> = {},
  ): ComputedRef<Record<string, unknown>> => computed(() =>
      getRevealMotionProps(
        toValue(effect),
        Number(toValue(delayMs) || 0),
        toValue(options) ?? {},
      ))

  return {
    resolved,
    getStaggerDelayMs,
    getRevealDelayMs,
    getRevealMotionProps,
    revealMotionKey,
    useRevealMotionProps,
  }
}
