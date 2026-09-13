import { describe, expect, it } from 'vitest'
import {
  type ProfileFieldValidationInput,
  validateProfileValues,
} from '../../layers/auth/app/utils/profileValidation'

const field = (
  overrides: Partial<ProfileFieldValidationInput>,
): ProfileFieldValidationInput => ({
  name: 'field_value',
  label: 'Value',
  type: 'string',
  required: false,
  editable: true,
  ...overrides,
})

const messagesFor = (
  input: Partial<ProfileFieldValidationInput>,
  value: unknown,
): string[] => {
  const definition = field(input)

  return validateProfileValues([definition], { [definition.name]: value })
    .map(error => error.message ?? '')
}

describe('validateProfileValues: required', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['whitespace', '   '],
    ['an empty array', []],
    ['an array of blanks', ['', '  ', null]],
  ])('treats %s as missing', (_label, value) => {
    expect(messagesFor({ required: true }, value)).toEqual(['Value is required'])
  })

  it('accepts a present value, including false and 0', () => {
    expect(messagesFor({ required: true }, 'x')).toEqual([])
    expect(messagesFor({ required: true, type: 'boolean' }, false)).toEqual([])
    expect(messagesFor({ required: true, type: 'integer' }, 0)).toEqual([])
  })

  it('falls back to a generic label', () => {
    expect(messagesFor({ required: true, label: '' }, '')).toEqual([
      'This field is required',
    ])
  })

  it('skips optional blank values and read-only fields', () => {
    expect(messagesFor({ type: 'email' }, '')).toEqual([])
    expect(messagesFor({ required: true, editable: false }, '')).toEqual([])
    expect(messagesFor({ type: 'link', editable: false }, 'not a url')).toEqual([])
  })
})

describe('validateProfileValues: cardinality', () => {
  it('rejects several values for a single-value field', () => {
    expect(messagesFor({}, ['a', 'b'])).toEqual(['Value accepts a single value'])
    expect(messagesFor({ cardinality: 1 }, ['a'])).toEqual([])
  })

  it('enforces a limited cardinality, ignoring blank entries', () => {
    expect(messagesFor({ cardinality: 2 }, ['a', 'b', ''])).toEqual([])
    expect(messagesFor({ cardinality: 2 }, ['a', 'b', 'c'])).toEqual([
      'Value accepts at most 2 values',
    ])
  })

  it('allows any number of values for unlimited cardinality', () => {
    expect(messagesFor({ cardinality: -1 }, ['a', 'b', 'c', 'd'])).toEqual([])
  })
})

describe('validateProfileValues: email', () => {
  it('validates email fields', () => {
    expect(messagesFor({ type: 'email' }, 'person@example.test')).toEqual([])
    expect(messagesFor({ type: 'email', name: 'field_contact' }, 'person')).toEqual([
      'Enter a valid email address',
    ])
  })

  it.each(['person', 'person@', '@example.test', 'person@example', 'a b@example.test'])(
    'rejects the malformed address %s',
    (value) => {
      expect(messagesFor({ type: 'email' }, value)).toEqual(['Enter a valid email address'])
    },
  )

  it('does not email-validate other field types named like email', () => {
    expect(messagesFor({ type: 'string', name: 'field_email_notes' }, 'free text')).toEqual([])
    expect(messagesFor({ type: 'string', label: 'Email preferences' }, 'weekly')).toEqual([])
  })

  it('treats a link field about email as an address and strips mailto:', () => {
    const input = { type: 'link', name: 'field_email_link' }

    expect(messagesFor(input, 'mailto:person@example.test')).toEqual([])
    expect(messagesFor(input, 'MAILTO:person@example.test')).toEqual([])
    expect(messagesFor(input, 'person@example.test')).toEqual([])
    expect(messagesFor(input, 'mailto:person')).toEqual(['Enter a valid email address'])
  })

  it('validates each entry of a multi-value email field', () => {
    const input = { type: 'email', cardinality: -1 }

    expect(messagesFor(input, ['a@example.test', 'b@example.test'])).toEqual([])
    expect(messagesFor(input, ['a@example.test', 'nope'])).toEqual([
      'Enter a valid email address',
    ])
  })
})

describe('validateProfileValues: link', () => {
  it('accepts http and https URLs', () => {
    expect(messagesFor({ type: 'link' }, 'https://example.test/path')).toEqual([])
    expect(messagesFor({ type: 'link' }, ' http://example.test ')).toEqual([])
  })

  it.each([
    'example.test',
    '/relative/path',
    'javascript:alert(1)',
    'ftp://example.test',
    'mailto:person@example.test',
    'https://',
  ])('rejects %s', (value) => {
    expect(messagesFor({ type: 'link' }, value)).toEqual([
      'Enter a valid URL starting with http:// or https://',
    ])
  })

  it('validates each entry of a multi-value link field', () => {
    expect(
      messagesFor({ type: 'link', cardinality: 3 }, ['https://a.test', 'nope']),
    ).toEqual(['Enter a valid URL starting with http:// or https://'])
  })
})

describe('validateProfileValues: multiple fields', () => {
  it('reports one error per failing field', () => {
    const errors = validateProfileValues(
      [
        field({ name: 'field_site', label: 'Website', type: 'link' }),
        field({ name: 'field_bio', label: 'Bio', required: true }),
        field({ name: 'field_ok', label: 'OK' }),
      ],
      { field_site: 'nope', field_bio: '', field_ok: 'fine' },
    )

    expect(errors.map(error => error.name)).toEqual(['field_site', 'field_bio'])
  })
})
