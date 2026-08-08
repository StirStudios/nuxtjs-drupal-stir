import type { VueHeadClient } from '@unhead/vue'
import { resolveTags } from 'unhead/utils'

type LegacyDevtoolsHead = VueHeadClient & {
  resolveTags?: () => ReturnType<typeof resolveTags>
}

export function installNuxtDevtoolsUnheadCompat(head: VueHeadClient): void {
  const legacyHead = head as LegacyDevtoolsHead

  if (legacyHead.resolveTags) return

  legacyHead.resolveTags = () => resolveTags(head)
}
