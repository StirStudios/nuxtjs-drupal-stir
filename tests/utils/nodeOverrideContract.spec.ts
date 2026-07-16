import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function source(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('node override contract', () => {
  it('keeps NodeDisplay responsible for hero and all direct field slots', () => {
    const nodeDisplay = source('layers/theme/app/components/Drupal/NodeDisplay.vue')

    expect(nodeDisplay).toContain('name="hero"')
    expect(nodeDisplay).toContain('contentSlotNames')
    expect(nodeDisplay).toContain(':name="slotName"')
    expect(nodeDisplay).toContain(':url="props.url || props.path?.alias"')

    const nodeTypes = source('layers/theme/app/types/Node.ts')

    expect(nodeTypes).toContain('url?: string')
  })

  it('uses the accessible default layout when Drupal omits page_layout', () => {
    const pageRoute = source('layers/theme/app/components/Drupal/PageRoute.vue')

    expect(pageRoute).toContain('pageLayout.value || \'default\'')
  })

  it('keeps the default node component forwarding every Drupal slot', () => {
    const nodeDefault = source('layers/theme/app/components/global/node--default.vue')

    expect(nodeDefault).toContain('forwardedSlotNames')
    expect(nodeDefault).toContain('#[slotName]="slotProps"')
  })
})
