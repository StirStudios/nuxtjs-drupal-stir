import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'

export type RouteHeroVariant = 'cover' | 'simple' | 'overlap'

export interface RouteHeroAction {
  label: string
  to: string
  color?: string
  variant?: string
  icon?: string
  external?: boolean
}

export interface RouteHeroImage {
  src: string
  alt?: string
  width?: number
  height?: number
  originalSrc?: string
  originalRevision?: string
  position?: string
}

export interface RouteHero {
  title: string
  titleLines?: string[]
  eyebrow?: string
  description?: string
  actions?: RouteHeroAction[]
  image?: RouteHeroImage
  variant?: RouteHeroVariant
  hideTitle?: boolean
  // Playable media owns its thumbnail, so media-first heroes render no backdrop.
  mediaFirst?: boolean
  surfaceClass?: string
}

export type RouteHeroInput = Partial<Omit<RouteHero, 'image'>> & {
  image?: Partial<RouteHeroImage> | null
}

export type RouteHeroDefinition = RouteHeroInput & { path: string }

export type RouteHeroResolverContext = {
  route: {
    path: string
    params: Record<string, unknown>
    query: Record<string, unknown>
    meta: Record<string, unknown>
  }
  page: Ref<unknown>
  pageHero: ComputedRef<RouteHero | null>
}

// Runs inside the route hero's setup scope, so it may call composables.
export type RouteHeroResolver = (
  context: RouteHeroResolverContext,
) => MaybeRefOrGetter<RouteHeroInput | false | null | undefined>
