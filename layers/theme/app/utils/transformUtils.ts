import { toSnakeCase } from './stringUtils'

type OptionObject = { label: string; description?: string }
type OptionValue = string | OptionObject
type AddressPayload = {
  address?: string
  address_2?: string
  city?: string
  stateProvince?: string
  postalCode?: string
  country?: string
}

function isOptionObject(value: OptionValue): value is OptionObject {
  return typeof value === 'object' && value !== null && 'label' in value
}

function isAddressPayload(value: unknown): value is AddressPayload {
  return typeof value === 'object' && value !== null && 'address' in value
}

export function transformOptions(
  optionMap: Record<string, OptionValue>,
) {
  return Object.entries(optionMap).map(([value, option]) => {
    return {
      value,
      label: isOptionObject(option) ? option.label : option,
      description: isOptionObject(option) ? (option.description ?? '') : '',
    }
  })
}

export function transformPayloadToSnakeCase<T extends Record<string, unknown>>(
  payload: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  Object.entries(payload).forEach(([key, value]) => {
    const snakeKey = toSnakeCase(key)

    if (value === null || value === undefined) {
      result[snakeKey] = value
      return
    }

    if (isAddressPayload(value) && typeof value.address === 'string') {
      result[snakeKey] = {
        address: value.address ?? '',
        address_2: value.address_2 ?? '',
        city: value.city ?? '',
        state_province: value.stateProvince ?? '',
        postal_code: value.postalCode ?? '',
        country: value.country ?? '',
      }
      return
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = Object.values(value)
        .map((v) => (typeof v === 'string' ? toSnakeCase(v) : v))
        .filter(Boolean)
      return
    }

    if (Array.isArray(value)) {
      result[snakeKey] = value
        .map((v) => {
          if (typeof v !== 'string') return v

          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{4}$/.test(v)) return v

          return toSnakeCase(v)
        })
        .filter(Boolean)
      return
    }

    if (typeof value === 'boolean') {
      result[snakeKey] = value ? '1' : '0'
      return
    }

    if (typeof value === 'string') {
      result[snakeKey] = value
      return
    }

    result[snakeKey] = value
  })

  return result
}
