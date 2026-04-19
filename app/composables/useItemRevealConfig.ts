type ItemRevealLike = {
  durationMs?: unknown
  staggerMs?: unknown
  threshold?: unknown
  rootMargin?: unknown
  ease?: unknown
}

export type RevealResolved = {
  durationMs: number
  staggerMs: number
  threshold: number
  rootMargin: string
  ease: [number, number, number, number]
}

const ITEM_REVEAL_DEFAULTS = {
  durationMs: 800,
  staggerMs: 250,
  threshold: 0.08,
  rootMargin: '0px 0px -5% 0px',
  ease: [0.42, 0, 0.58, 1] as [number, number, number, number],
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

export function useRevealConfig() {
  const theme = useAppConfig().stirTheme

  const raw = computed<ItemRevealLike>(() => {
    return (theme.animations?.reveal || {}) as ItemRevealLike
  })

  const resolved = computed<RevealResolved>(() => ({
    durationMs: toFiniteNumber(raw.value.durationMs, ITEM_REVEAL_DEFAULTS.durationMs),
    staggerMs: toFiniteNumber(raw.value.staggerMs, ITEM_REVEAL_DEFAULTS.staggerMs),
    threshold: toFiniteNumber(raw.value.threshold, ITEM_REVEAL_DEFAULTS.threshold),
    rootMargin:
      typeof raw.value.rootMargin === 'string'
        ? raw.value.rootMargin
        : ITEM_REVEAL_DEFAULTS.rootMargin,
    ease: toCubicBezier(raw.value.ease, ITEM_REVEAL_DEFAULTS.ease),
  }))

  return {
    resolved,
  }
}

export function useItemRevealConfig() {
  const { resolved } = useRevealConfig()

  const getStaggerDelayMs = (index: number, startIndex: number = 0) => {
    return Math.max(0, index - startIndex) * Math.max(0, resolved.value.staggerMs)
  }

  return {
    resolved,
    getStaggerDelayMs,
  }
}
