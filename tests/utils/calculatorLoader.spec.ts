import { describe, expect, it } from 'vitest'
import { refuseProductionCalculatorOverride } from '../../layers/theme/build/calculatorLoader'

const override = 'https://staging.example.com/widgets/loader.js'

describe('calculator loader in production', () => {
  it('fails a production build that overrides the committed loader', () => {
    expect(() => refuseProductionCalculatorOverride({
      NUXT_ENV: 'production',
      NUXT_PUBLIC_CALCULATOR_LOADER_URL: override,
    })).toThrow('NUXT_PUBLIC_CALCULATOR_LOADER_URL is set in a production environment')
  })

  it('lets production use the committed loader, and other environments override it', () => {
    expect(() => refuseProductionCalculatorOverride({ NUXT_ENV: 'production' })).not.toThrow()
    expect(() => refuseProductionCalculatorOverride({
      NUXT_ENV: 'staging',
      NUXT_PUBLIC_CALCULATOR_LOADER_URL: override,
    })).not.toThrow()
    expect(() => refuseProductionCalculatorOverride({
      NUXT_PUBLIC_CALCULATOR_LOADER_URL: override,
    })).not.toThrow()
  })
})
