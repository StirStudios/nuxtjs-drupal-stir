import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const rendererPath = resolve(
  process.cwd(),
  'app/components/Field/Renderer.vue',
)

describe('FieldRenderer layer override wiring', () => {
  it('resolves field components from #components instead of direct file imports', () => {
    const source = readFileSync(rendererPath, 'utf8')

    expect(source).toContain("from '#components'")
    expect(source).toContain('textfield: FieldInput')
    expect(source).toContain('number: FieldInputNumber')
    expect(source).toContain('range: FieldInputSlider')

    expect(source).not.toContain("import('~/components/Field/Input.vue')")
    expect(source).not.toContain(
      "import('~/components/Field/Input/Number.vue')",
    )
    expect(source).not.toContain(
      "import('~/components/Field/Input/Slider.vue')",
    )
  })
})
