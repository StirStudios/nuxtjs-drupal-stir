export function toPascalCase(str: string): string {
  return str.replace(/_./g, (match) => match.charAt(1).toUpperCase())
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, '')
}

export const extractFieldName = (selector: string): string | null => {
  const match = selector.match(/name="(.+?)"/)

  if (!match || !match[1]) {
    return null
  }
  return match[1].replace(/\[([^\]]+)\]/g, '.$1')
}

export const normalizeValue = (value: string): string => {
  return value.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export function truncate(text: string, length = 120): string {
  if (!text) return ''
  return text.length > length ? text.slice(0, length).trimEnd() + '…' : text
}

export function slugify(str: string): string {
  if (!str) return ''

  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
}
