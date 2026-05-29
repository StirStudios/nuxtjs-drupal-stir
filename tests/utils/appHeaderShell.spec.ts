import { describe, expect, it } from 'vitest'
import { buildAppHeaderRootClasses } from '../../layers/theme/app/utils/headerClasses'

const navigation = {
  base: 'h-auto transform py-3 duration-500 uppercase',
  background: 'border-none bg-taupe shadow-md backdrop-blur-md dark:bg-brown',
  isHidden: false,
  transparentTop: true,
}

function headerClasses(
  overrides: Partial<Parameters<typeof buildAppHeaderRootClasses>[0]> = {},
) {
  return buildAppHeaderRootClasses({
    atBottom: false,
    finalIsScrolled: false,
    isAdministrator: false,
    isFixed: true,
    isFront: true,
    navigation,
    scrollDirection: null,
    ...overrides,
  })
}

describe('buildAppHeaderRootClasses', () => {
  it('keeps the configured transparent top classes before scroll', () => {
    const classes = headerClasses()

    expect(classes).toContain('stir-header')
    expect(classes).toContain('fixed z-50 w-full top-0')
    expect(classes).toContain('bg-transparent')
    expect(classes).toContain('backdrop-none')
    expect(classes).not.toContain(navigation.background)
    expect(classes).not.toContain('stir-header--hidden')
  })

  it('switches to configured background classes after scroll', () => {
    const classes = headerClasses({ finalIsScrolled: true })

    expect(classes).toContain('is-scrolled')
    expect(classes).toContain('stir-header--scrolled')
    expect(classes).toContain(navigation.background)
    expect(classes).not.toContain('bg-transparent')
  })

  it('hides on downward scroll while fixed and scrolled', () => {
    const classes = headerClasses({
      finalIsScrolled: true,
      scrollDirection: 'down',
    })

    expect(classes).toContain('stir-header--hidden')
  })

  it('reveals on upward scroll and at the page bottom', () => {
    expect(
      headerClasses({
        finalIsScrolled: true,
        scrollDirection: 'up',
      }),
    ).not.toContain('stir-header--hidden')

    expect(
      headerClasses({
        atBottom: true,
        finalIsScrolled: true,
        scrollDirection: 'down',
      }),
    ).not.toContain('stir-header--hidden')
  })

  it('does not hide when navigation is static', () => {
    const classes = headerClasses({
      finalIsScrolled: true,
      isFixed: false,
      scrollDirection: 'down',
    })

    expect(classes).toContain('relative w-full')
    expect(classes).not.toContain('stir-header--hidden')
  })

  it('keeps administrator offset unless the header is hidden', () => {
    expect(
      headerClasses({
        finalIsScrolled: true,
        isAdministrator: true,
        scrollDirection: 'up',
      }),
    ).toContain('top-[3.1rem]')

    expect(
      headerClasses({
        finalIsScrolled: true,
        isAdministrator: true,
        scrollDirection: 'down',
      }),
    ).toContain('top-0')
  })
})
