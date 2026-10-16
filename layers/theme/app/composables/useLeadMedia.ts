import type { InjectionKey } from 'vue'

type LeadMediaTracker = { sections: number, lead?: string, eager?: boolean }

const leadMediaTrackerKey: InjectionKey<LeadMediaTracker> = Symbol('stirLeadMediaTracker')
const sectionIndexKey: InjectionKey<number> = Symbol('stirSectionIndex')

/**
 * Starts lead-media tracking for one rendered page. The page component is
 * recreated per navigation and setup runs in document order on the server
 * and during hydration, so both sides reach the same answer.
 */
export function provideLeadMediaTracker(): void {
  const { hero } = useRouteHero()
  const routeHero = useAppConfig().stirTheme.routeHero
  // A route hero image renders above the page and is its own lead, so no
  // page media can be.
  const heroImage = routeHero.enabled && hero.value?.image && hero.value.variant !== 'simple'

  provide(leadMediaTrackerKey, heroImage ? { sections: 0, lead: 'route-hero', eager: false } : { sections: 0 })
}

/** Records a top-level layout section's position on the page. */
export function provideLeadMediaSection(): void {
  const tracker = inject(leadMediaTrackerKey, undefined)

  if (!tracker || inject(sectionIndexKey, undefined) !== undefined) return

  provide(sectionIndexKey, tracker.sections++)
}

/**
 * Whether this paragraph's media is the page's likely Largest Contentful
 * Paint and should load eagerly. Only the first media paragraph on the page
 * can be the lead, and only when it renders before or inside the first
 * section; anything lower stays lazy because it may be below the fold.
 */
export function useLeadMedia(key: string | number | undefined): boolean {
  const tracker = inject(leadMediaTrackerKey, undefined)
  const id = key === undefined || key === '' ? '' : String(key)

  if (!tracker || !id) return false
  if (tracker.lead === undefined) {
    tracker.lead = id
    tracker.eager = inject(sectionIndexKey, tracker.sections) === 0
  }

  return tracker.lead === id && tracker.eager === true
}
