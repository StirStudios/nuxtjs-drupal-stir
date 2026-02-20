export const defaultTransitionConfig = {
  duration: 1.2,
  ease: [0.42, 0, 0.58, 1],
  type: 'spring',
  stiffness: 250,
  damping: 40,
  delay: 0.2,
  staggerChildren: 0.3,
}

type SpringConfig = {
  duration?: number
  stiffness?: number
  damping?: number
  mass?: number
  ease?: readonly number[]
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function springResponseAt(timeSeconds: number, config: SpringConfig): number {
  const stiffness = config.stiffness ?? 100
  const damping = config.damping ?? 10
  const mass = config.mass ?? 1

  const omegaN = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))

  if (zeta < 1) {
    const omegaD = omegaN * Math.sqrt(1 - zeta * zeta)
    const envelope = Math.exp(-zeta * omegaN * timeSeconds)
    const c = zeta / Math.sqrt(1 - zeta * zeta)

    return 1 - envelope * (Math.cos(omegaD * timeSeconds) + c * Math.sin(omegaD * timeSeconds))
  }

  if (zeta === 1) {
    return 1 - Math.exp(-omegaN * timeSeconds) * (1 + omegaN * timeSeconds)
  }

  const sqrtTerm = Math.sqrt(zeta * zeta - 1)
  const r1 = -omegaN * (zeta - sqrtTerm)
  const r2 = -omegaN * (zeta + sqrtTerm)

  return 1 + (r2 * Math.exp(r1 * timeSeconds) - r1 * Math.exp(r2 * timeSeconds)) / (r1 - r2)
}

export function createSpringLinearEasing(
  config: SpringConfig = defaultTransitionConfig,
  points = 20,
): string {
  const duration = Math.max(0.1, config.duration ?? 1.2)
  const endValue = springResponseAt(duration, config)

  if (!Number.isFinite(endValue) || endValue <= 0) {
    const ease = config.ease ?? [0.42, 0, 0.58, 1]

    return `cubic-bezier(${ease.join(', ')})`
  }

  const stops = Array.from({ length: points + 1 }, (_, i) => {
    const progress = i / points
    const timeSeconds = progress * duration
    const raw = springResponseAt(timeSeconds, config) / endValue
    const value = clamp01(raw)
    const pct = Math.round(progress * 100)

    return `${value.toFixed(4)} ${pct}%`
  })

  return `linear(${stops.join(', ')})`
}

export const getMotionEffect = (
  direction: string,
  transitionConfig = defaultTransitionConfig,
) => {
  const baseEffect = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: transitionConfig },
  }

  const effects = {
    'fade-in': baseEffect,
    'fade-up': {
      hidden: { opacity: 0, y: 100 },
      show: { opacity: 1, y: 0, transition: transitionConfig },
    },
    'fade-down': {
      hidden: { opacity: 0, y: -100 },
      show: { opacity: 1, y: 0, transition: transitionConfig },
    },
    'fade-left': {
      hidden: { opacity: 0, x: -100 },
      show: { opacity: 1, x: 0, transition: transitionConfig },
    },
    'fade-right': {
      hidden: { opacity: 0, x: 100 },
      show: { opacity: 1, x: 0, transition: transitionConfig },
    },

    'flip-up': {
      hidden: { opacity: 0, rotateX: 90 },
      show: { opacity: 1, rotateX: 0, transition: transitionConfig },
    },
    'flip-down': {
      hidden: { opacity: 0, rotateX: -90 },
      show: { opacity: 1, rotateX: 0, transition: transitionConfig },
    },
    'flip-left': {
      hidden: { opacity: 0, rotateY: -90 },
      show: { opacity: 1, rotateY: 0, transition: transitionConfig },
    },
    'flip-right': {
      hidden: { opacity: 0, rotateY: 90 },
      show: { opacity: 1, rotateY: 0, transition: transitionConfig },
    },

    'slide-up': {
      hidden: { opacity: 0, y: 100 },
      show: { opacity: 1, y: 0, transition: transitionConfig },
    },
    'slide-down': {
      hidden: { opacity: 0, y: -100 },
      show: { opacity: 1, y: 0, transition: transitionConfig },
    },
    'slide-left': {
      hidden: { opacity: 0, x: -100 },
      show: { opacity: 1, x: 0, transition: transitionConfig },
    },
    'slide-right': {
      hidden: { opacity: 0, x: 100 },
      show: { opacity: 1, x: 0, transition: transitionConfig },
    },

    'zoom-in': {
      hidden: { opacity: 0, scale: 0.8 },
      show: { opacity: 1, scale: 1, transition: transitionConfig },
    },
    'zoom-out': {
      hidden: { opacity: 0, scale: 1.2 },
      show: { opacity: 1, scale: 1, transition: transitionConfig },
    },

    'zoom-in-up': {
      hidden: { opacity: 0, scale: 0.8, y: 100 },
      show: { opacity: 1, scale: 1, y: 0, transition: transitionConfig },
    },
    'zoom-in-down': {
      hidden: { opacity: 0, scale: 0.8, y: -100 },
      show: { opacity: 1, scale: 1, y: 0, transition: transitionConfig },
    },
    'zoom-in-left': {
      hidden: { opacity: 0, scale: 0.8, x: -100 },
      show: { opacity: 1, scale: 1, x: 0, transition: transitionConfig },
    },
    'zoom-in-right': {
      hidden: { opacity: 0, scale: 0.8, x: 100 },
      show: { opacity: 1, scale: 1, x: 0, transition: transitionConfig },
    },

    'zoom-out-up': {
      hidden: { opacity: 0, scale: 1.2, y: 100 },
      show: { opacity: 1, scale: 1, y: 0, transition: transitionConfig },
    },
    'zoom-out-down': {
      hidden: { opacity: 0, scale: 1.2, y: -100 },
      show: { opacity: 1, scale: 1, y: 0, transition: transitionConfig },
    },
    'zoom-out-left': {
      hidden: { opacity: 0, scale: 1.2, x: -100 },
      show: { opacity: 1, scale: 1, x: 0, transition: transitionConfig },
    },
    'zoom-out-right': {
      hidden: { opacity: 0, scale: 1.2, x: 100 },
      show: { opacity: 1, scale: 1, x: 0, transition: transitionConfig },
    },
  }

  return effects[direction as keyof typeof effects] || baseEffect
}
