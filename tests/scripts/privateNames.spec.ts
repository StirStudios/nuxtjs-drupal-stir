import { describe, expect, it } from 'vitest'
import { containsPrivateName } from '../../scripts/audit/private-names.mjs'

// Spelled backwards so this file does not itself name a client project.
const reversed = (value: string) => [...value].reverse().join('')

describe('private name check', () => {
  it('finds a client name however it is spelled', () => {
    const name = reversed('gulpecnad')

    expect(containsPrivateName(name)).toBe(true)
    expect(containsPrivateName(`Thanks, ${name.toUpperCase()}!`)).toBe(true)
    expect(containsPrivateName(`${name.slice(0, 5)} ${name.slice(5)} site`)).toBe(true)
    expect(containsPrivateName(`${name.slice(0, 5)}-${name.slice(5)}-nuxt`)).toBe(true)
    expect(containsPrivateName(`https://assets.${reversed('eunevarepip')}.com/loader.js`)).toBe(true)
    expect(containsPrivateName(`${reversed('alliv')} & ${reversed('eniv')}`)).toBe(true)
    expect(containsPrivateName(`${reversed('alliv')} and ${reversed('eniv')}`)).toBe(true)
  })

  it('leaves ordinary words and examples alone', () => {
    expect(containsPrivateName('A client site loads https://assets.example.com/loader.js')).toBe(false)
    expect(containsPrivateName('dance classes and a plug-in')).toBe(false)
  })
})
