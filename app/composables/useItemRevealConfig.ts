type ItemRevealLike = {
  durationMs?: unknown
  offsetY?: unknown
  staggerMs?: unknown
  threshold?: unknown
  rootMargin?: unknown
}

export type ItemRevealResolved = {
  durationMs: number
  offsetY: string
  staggerMs: number
  threshold: number
  rootMargin: string
}

const ITEM_REVEAL_DEFAULTS = {
  durationMs: 800,
  offsetY: '4rem',
  staggerMs: 250,
  threshold: 0.08,
  rootMargin: '0px 0px -5% 0px',
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

export function useItemRevealConfig() {
  const theme = useAppConfig().stirTheme

  const raw = computed<ItemRevealLike>(() => {
    return (theme.animations?.itemReveal ||
      theme.animations?.mediaReveal ||
      {}) as ItemRevealLike
  })

  const resolved = computed<ItemRevealResolved>(() => ({
    durationMs: toFiniteNumber(raw.value.durationMs, ITEM_REVEAL_DEFAULTS.durationMs),
    offsetY:
      typeof raw.value.offsetY === 'string'
        ? raw.value.offsetY
        : ITEM_REVEAL_DEFAULTS.offsetY,
    staggerMs: toFiniteNumber(raw.value.staggerMs, ITEM_REVEAL_DEFAULTS.staggerMs),
    threshold: toFiniteNumber(raw.value.threshold, ITEM_REVEAL_DEFAULTS.threshold),
    rootMargin:
      typeof raw.value.rootMargin === 'string'
        ? raw.value.rootMargin
        : ITEM_REVEAL_DEFAULTS.rootMargin,
  }))

  const getStaggerDelayMs = (index: number, startIndex: number = 0) => {
    return Math.max(0, index - startIndex) * Math.max(0, resolved.value.staggerMs)
  }

  return {
    resolved,
    getStaggerDelayMs,
  }
}
