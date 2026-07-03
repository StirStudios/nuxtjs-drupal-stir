import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function source(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('node override contract', () => {
  it('keeps NodeDisplay responsible for hero and section slots', () => {
    const nodeDisplay = source('layers/theme/app/components/Drupal/NodeDisplay.vue')

    expect(nodeDisplay).toContain('name="hero"')
    expect(nodeDisplay).toContain('name="section"')
  })

  it('keeps the default node component forwarding hero and section slots', () => {
    const nodeDefault = source('layers/theme/app/components/global/node--default.vue')

    expect(nodeDefault).toContain('name="hero"')
    expect(nodeDefault).toContain('name="section"')
  })
})
