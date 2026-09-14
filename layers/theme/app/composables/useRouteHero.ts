import type {
  RouteHero,
  RouteHeroInput,
  RouteHeroResolver,
} from '../types/RouteHero'
import { isDrupalRenderedRoute } from '../utils/drupalPage'
import {
  matchRouteHeroDefinition,
  normalizeRouteHero,
  resolvePageRouteHero,
  resolvePageRouteHeroImages,
  resolveRouteHeroElements,
} from '../utils/routeHero'

const resolversKey = Symbol.for('stir:route-hero-resolvers')

// Resolvers live on the per-request Nuxt app, never at module scope.
function routeHeroResolvers(): RouteHeroResolver[] {
  const nuxtApp = useNuxtApp() as unknown as Record<symbol, RouteHeroResolver[] | undefined>

  return (nuxtApp[resolversKey] ??= [])
}

/**
 * Registers a project resolver, typically from a Nuxt plugin. The first
 * resolver returning a hero wins; `false` suppresses the hero for the route.
 */
export function registerRouteHeroResolver(resolver: RouteHeroResolver): () => void {
  const resolvers = routeHeroResolvers()

  resolvers.push(resolver)

  return () => {
    const index = resolvers.indexOf(resolver)

    if (index >= 0) resolvers.splice(index, 1)
  }
}

export function useRouteHero() {
  const route = useRoute()
  const page = useStirDrupalCe().getPage()
  const config = useAppConfig().stirTheme.routeHero
  const elements = resolveRouteHeroElements(config.elements)
  const imageSeed = config.imageSelection === 'random'
    ? useState('stir-route-hero-image-seed', () => Math.random())
    : undefined

  // The shared page state keeps the last Drupal payload on Nuxt-only routes.
  const pageHero = computed<RouteHero | null>(() => {
    if (!isDrupalRenderedRoute(route)) return null

    const hero = resolvePageRouteHero(page.value, elements)
    const images = imageSeed ? resolvePageRouteHeroImages(page.value) : []

    return hero && imageSeed && images.length
      ? { ...hero, image: images[Math.floor(imageSeed.value * images.length)] }
      : hero
  })
  const resolved = routeHeroResolvers().map(resolver => resolver({ route, page, pageHero }))
  const withPageHero = (input: RouteHeroInput) =>
    normalizeRouteHero({ ...pageHero.value, ...input })

  const hero = computed<RouteHero | null>(() => {
    const meta = route.meta.routeHero as RouteHeroInput | false | undefined

    if (meta === false) return null
    if (meta) return withPageHero(meta)

    for (const result of resolved) {
      const value = toValue(result)

      if (value === false) return null
      if (value) return normalizeRouteHero(value)
    }

    const definition = matchRouteHeroDefinition(route.path, config.routes)

    if (definition) {
      const { path: _path, ...input } = definition

      return withPageHero(input)
    }

    return pageHero.value
  })

  return { hero, pageHero }
}
