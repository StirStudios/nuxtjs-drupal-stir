import { beforeEach, describe, expect, it, vi } from 'vitest'
import { overrideFallbackComponent } from '../../config/componentOverrides'

type RegisteredComponent = {
  pascalName: string
  filePath: string
  declarationPath?: string
  shortPath?: string
}

const hooks = vi.hoisted(() => ({
  extend: undefined as undefined | ((components: RegisteredComponent[]) => void),
}))

vi.mock('@nuxt/kit', () => ({
  useNuxt: () => ({
    hook: (_name: string, handler: (components: RegisteredComponent[]) => void) => {
      hooks.extend = handler
    },
  }),
}))

const component = (pascalName: string, filePath: string): RegisteredComponent => ({
  pascalName,
  filePath,
  declarationPath: filePath,
  shortPath: filePath,
})

describe('overrideFallbackComponent', () => {
  beforeEach(() => {
    hooks.extend = undefined
  })

  it('swaps the placeholder only when the predicate allows it', () => {
    overrideFallbackComponent(
      'StirPdfViewer',
      '/layer/stub.vue',
      '/layer/real.vue',
      components => components.some(entry => entry.pascalName === 'PdfViewer'),
    )

    const withoutViewer = [component('StirPdfViewer', '/layer/stub.vue')]

    hooks.extend?.(withoutViewer)
    expect(withoutViewer[0]?.filePath).toBe('/layer/stub.vue')

    const withViewer = [
      component('StirPdfViewer', '/layer/stub.vue'),
      component('PdfViewer', 'vue-pdf-viewer-core'),
    ]

    hooks.extend?.(withViewer)
    expect(withViewer[0]).toMatchObject({
      filePath: '/layer/real.vue',
      declarationPath: '/layer/real.vue',
      shortPath: '/layer/real.vue',
    })
  })

  it('never replaces a consumer component of the same name', () => {
    overrideFallbackComponent('StirPdfViewer', '/layer/stub.vue', '/layer/real.vue')

    const consumer = [component('StirPdfViewer', '/project/app/components/StirPdfViewer.client.vue')]

    hooks.extend?.(consumer)
    expect(consumer[0]?.filePath).toBe('/project/app/components/StirPdfViewer.client.vue')
  })
})
