import { describe, expect, it } from 'vitest'
import {
  materialButton,
  materialSelectControl,
  materialTextControl,
  nuxtUiTheme,
} from '../../layers/theme/app/theme/nuxtUi'
import {
  materialVariant,
  materialVariantMuted,
  materialVariantWithPB,
} from '../../layers/theme/app/utils/uiVariants'

describe('Nuxt UI theme preset', () => {
  it('owns the Material variants for every supported control', () => {
    expect(nuxtUiTheme.input.variants.variant.material).toBe(
      materialTextControl,
    )
    expect(nuxtUiTheme.inputNumber.variants.variant.material).toBe(
      materialTextControl,
    )
    expect(nuxtUiTheme.textarea.variants.variant.material).toBe(
      materialTextControl,
    )
    expect(nuxtUiTheme.select.variants.variant.material).toBe(
      materialSelectControl,
    )
    expect(nuxtUiTheme.selectMenu.variants.variant.material).toBe(
      materialSelectControl,
    )
    expect(nuxtUiTheme.button.variants.variant.material).toBe(materialButton)
  })

  it('keeps the historical helpers as compatibility aliases', () => {
    expect(materialVariant).toBe(materialTextControl)
    expect(materialVariantWithPB).toBe(materialSelectControl)
    expect(materialVariantMuted).toBe(materialButton)
  })

  it('uses valid semantic Nuxt UI and Tailwind tokens', () => {
    expect(materialTextControl).toContain('text-highlighted')
    expect(materialTextControl).toContain('aria-invalid:border-b-error')
    expect(materialTextControl).not.toContain('transition-all')
    expect(materialButton).toContain('text-base')
    expect(materialButton).not.toContain('text-md')
  })

  it('start-aligns form errors independently of their container', () => {
    expect(nuxtUiTheme.formField.slots.error).toContain('text-start')
  })
})
